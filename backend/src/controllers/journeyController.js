const UserJourney = require('../models/UserJourney');
const FeatureSequence = require('../models/FeatureSequence');
const UserProfile = require('../models/UserProfile');
const geminiJourneyService = require('../services/geminiJourneyService');
const journeyService = require('../services/journeyService');
const {
  STAGES,
  SEQUENCES,
  FEATURES,
  getFeature,
  resolveFeatureFromRoute
} = require('../utils/journeyRegistry');

// Anonymous visitors send a client-generated session id so their pre-login
// activity still forms a coherent journey.
const sessionOf = (req) =>
  req.get('x-journey-session') || req.body?.sessionId || req.query?.sessionId || null;

const deviceOf = (req) => {
  const ua = req.get('user-agent') || '';
  if (/mobile|android|iphone/i.test(ua)) return 'mobile';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  return 'desktop';
};

// @desc    Current user's journey status (stage, progress, next step)
// @route   GET /api/journey/user-status
// @access  Public (richer when authenticated)
exports.getUserStatus = async (req, res) => {
  try {
    const status = await journeyService.buildStatus({
      user: req.user || null,
      sessionId: sessionOf(req),
      device: deviceOf(req),
      referrer: req.get('referer') || ''
    });

    return res.json({ success: true, data: status });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Gemini-guided "what should I do next"
// @route   POST /api/journey/next-suggestion
// @access  Public (richer when authenticated)
exports.getNextSuggestion = async (req, res) => {
  try {
    const { currentPage = '/', includeUpsell = false } = req.body || {};

    const status = await journeyService.buildStatus({
      user: req.user || null,
      sessionId: sessionOf(req),
      device: deviceOf(req),
      referrer: req.get('referer') || ''
    });

    const signals = await journeyService.collectSignals(req.user?._id || null);
    const journeyDoc = status.journeyId
      ? await UserJourney.findById(status.journeyId).lean().catch(() => null)
      : null;
    const recentSteps = journeyDoc?.stepsCompleted?.slice(-5)?.map((s) => s.step) || [];
    const completedFeatures = [...journeyService.completedFeatureIds(signals, journeyDoc)];

    const guidance = await geminiJourneyService.getNextStepGuidance({
      persona: status.persona,
      stage: status.stage,
      currentPage,
      recentSteps,
      profile: status.profile,
      signals,
      device: deviceOf(req),
      completedFeatures,
      userId: req.user?._id || null
    });

    // The registry-derived next step is the guaranteed floor; AI only enriches it.
    const fallbackNext = status.nextStep;
    const suggestedFeature = guidance.suggestedFeature || (fallbackNext ? getFeature(fallbackNext.featureId) : null);

    let upsell = null;
    if (includeUpsell) {
      upsell = await geminiJourneyService.getIntelligentSuggestion({
        persona: status.persona,
        stage: status.stage,
        profile: status.profile,
        cartItems: signals.cartItems,
        signals,
        userId: req.user?._id || null
      });
    }

    // Count that guidance was shown, for the accepted/ignored ratio.
    if (status.journeyId) {
      UserJourney.updateOne({ _id: status.journeyId }, { $inc: { 'guidance.shown': 1 } }).catch(() => {});
    }

    return res.json({
      success: true,
      data: {
        stage: guidance.currentStage || status.stage,
        nextStep: guidance.nextRecommendedStep,
        feature: suggestedFeature
          ? { featureId: suggestedFeature.id, label: suggestedFeature.label, route: suggestedFeature.route, blurb: suggestedFeature.blurb }
          : null,
        cta: guidance.suggestedCTA,
        helpMessage: guidance.helpMessage,
        urgency: guidance.urgency,
        upsell
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Record completion of a journey step
// @route   POST /api/journey/track-step
// @access  Public (richer when authenticated)
exports.trackStep = async (req, res) => {
  try {
    const {
      step,
      feature,
      route,
      outcome = 'success',
      data = {},
      conversion = null,
      guidanceAccepted = null
    } = req.body || {};

    if (!step && !route) {
      return res.status(400).json({ success: false, error: 'step or route is required' });
    }

    const sessionId = sessionOf(req);
    const userId = req.user?._id || null;
    if (!sessionId && !userId) {
      return res.status(400).json({ success: false, error: 'A sessionId (x-journey-session header) is required for anonymous tracking' });
    }

    const persona = journeyService.personaFor(req.user);
    const journey = await journeyService.getOrCreateJourney({
      userId,
      sessionId,
      persona,
      device: deviceOf(req),
      referrer: req.get('referer') || ''
    });

    // Let the client name the feature, else infer it from the route it reported.
    const resolved = (feature && FEATURES[feature])
      ? FEATURES[feature]
      : resolveFeatureFromRoute(route);

    const last = journey.stepsCompleted[journey.stepsCompleted.length - 1];
    const now = Date.now();
    const duration = last ? now - new Date(last.completedAt).getTime() : 0;

    const validOutcome = ['success', 'abandoned', 'revisited', 'viewed'].includes(outcome) ? outcome : 'success';

    journey.stepsCompleted.push({
      step: step || resolved?.label || route,
      feature: resolved?.id || null,
      stage: resolved?.stage || journey.currentStage,
      completedAt: new Date(now),
      duration,
      outcome: validOutcome,
      data
    });

    // Keep the step log bounded — a long-lived journey shouldn't grow unbounded.
    if (journey.stepsCompleted.length > 200) {
      journey.stepsCompleted = journey.stepsCompleted.slice(-200);
    }

    if (conversion?.type) {
      journey.conversions.push({
        type: conversion.type,
        value: Number(conversion.value) || 0,
        source: resolved?.id || conversion.source || null,
        timestamp: new Date()
      });
      if (conversion.type === 'purchase') {
        journey.status = 'completed';
        journey.completedAt = new Date();
        journey.totalDuration = now - new Date(journey.startedAt).getTime();
      }
    }

    if (guidanceAccepted === true) journey.guidance.accepted += 1;
    if (guidanceAccepted === false) journey.guidance.ignored += 1;

    if (resolved?.stage) journey.currentStage = resolved.stage;
    journey.lastActiveAt = new Date();
    await journey.save();

    return res.json({ success: true, data: { journeyId: journey._id, stepsRecorded: journey.stepsCompleted.length } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Journey funnel counts across all users
// @route   GET /api/journey/funnel
// @access  Private/Admin
exports.getFunnel = async (req, res) => {
  try {
    const rows = await UserJourney.aggregate([
      { $group: { _id: '$currentStage', count: { $sum: 1 } } }
    ]);

    const byStage = STAGES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    rows.forEach((r) => { if (r._id && byStage[r._id] !== undefined) byStage[r._id] = r.count; });

    const totalJourneys = await UserJourney.countDocuments();
    const purchased = await UserJourney.countDocuments({ 'conversions.type': 'purchase' });
    const conversionRate = totalJourneys > 0 ? (purchased / totalJourneys) * 100 : 0;

    // A funnel is cumulative: everyone at a later stage also cleared the earlier ones.
    const cumulative = {};
    STAGES.forEach((stage, i) => {
      cumulative[stage] = STAGES.slice(i).reduce((sum, s) => sum + byStage[s], 0);
    });

    return res.json({
      success: true,
      data: {
        totalJourneys,
        byStage,
        funnel: cumulative,
        purchased,
        conversionRate: Number(conversionRate.toFixed(2))
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Per-feature usage and conversion lift
// @route   GET /api/journey/feature-impact
// @access  Private/Admin
exports.getFeatureImpact = async (req, res) => {
  try {
    const totalJourneys = await UserJourney.countDocuments();
    const baselineConverted = await UserJourney.countDocuments({ 'conversions.type': 'purchase' });
    const baselineRate = totalJourneys > 0 ? (baselineConverted / totalJourneys) * 100 : 0;

    const usage = await UserJourney.aggregate([
      { $unwind: '$stepsCompleted' },
      { $match: { 'stepsCompleted.feature': { $ne: null } } },
      {
        $group: {
          _id: { journey: '$_id', feature: '$stepsCompleted.feature' },
          converted: { $max: { $cond: [{ $gt: [{ $size: '$conversions' }, 0] }, 1, 0] } }
        }
      },
      {
        $group: {
          _id: '$_id.feature',
          journeys: { $sum: 1 },
          converted: { $sum: '$converted' }
        }
      }
    ]);

    const featureImpact = {};
    Object.keys(FEATURES).forEach((id) => {
      const row = usage.find((u) => u._id === id);
      const journeys = row?.journeys || 0;
      const converted = row?.converted || 0;
      const rate = journeys > 0 ? (converted / journeys) * 100 : 0;

      featureImpact[id] = {
        label: FEATURES[id].label,
        stage: FEATURES[id].stage,
        journeys,
        usageRate: totalJourneys > 0 ? Number(((journeys / totalJourneys) * 100).toFixed(2)) : 0,
        conversionRate: Number(rate.toFixed(2)),
        // Percentage-point lift vs. the all-journeys baseline.
        conversionLift: Number((rate - baselineRate).toFixed(2))
      };
    });

    return res.json({
      success: true,
      data: { totalJourneys, baselineConversionRate: Number(baselineRate.toFixed(2)), featureImpact }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Contextual help for the page the user is on
// @route   POST /api/journey/context-help
// @access  Public (richer when authenticated)
exports.getContextHelp = async (req, res) => {
  try {
    const { page = '/', issue = '' } = req.body || {};
    const persona = journeyService.personaFor(req.user);

    const signals = await journeyService.collectSignals(req.user?._id || null);
    const stage = journeyService.inferStage(signals, persona);

    const help = await geminiJourneyService.getContextualHelp({
      page,
      issue,
      persona,
      stage,
      userId: req.user?._id || null
    });

    return res.json({ success: true, data: help });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Reference journey path for a user segment
// @route   GET /api/journey/recommended-path/:userSegment
// @access  Public
exports.getRecommendedPath = async (req, res) => {
  try {
    const segment = String(req.params.userSegment || '').toLowerCase();
    const sequence = SEQUENCES[segment];

    if (!sequence) {
      return res.status(404).json({
        success: false,
        error: `Unknown segment "${segment}". Expected one of: ${Object.keys(SEQUENCES).join(', ')}`
      });
    }

    const path = sequence.map((id, index) => {
      const f = getFeature(id);
      return { order: index + 1, featureId: id, label: f?.label, route: f?.route, blurb: f?.blurb, stage: f?.stage };
    });

    // Observed completion rate for this segment, when we have journeys to learn from.
    const total = await UserJourney.countDocuments({ persona: segment });
    const converted = await UserJourney.countDocuments({ persona: segment, 'conversions.0': { $exists: true } });
    const observedRate = total > 0 ? converted / total : null;

    const durations = await UserJourney.find({ persona: segment, totalDuration: { $gt: 0 } })
      .select('totalDuration').limit(200).lean();
    const avgDuration = durations.length
      ? durations.reduce((s, d) => s + d.totalDuration, 0) / durations.length
      : 0;

    return res.json({
      success: true,
      data: {
        segment,
        path,
        expectedDuration: avgDuration ? journeyService.formatDuration(avgDuration) : 'not enough data yet',
        conversionProbability: observedRate !== null ? Number(observedRate.toFixed(2)) : null,
        sampleSize: total
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Personalised ordering of features for this user
// @route   POST /api/journey/personalize-flow
// @access  Private
exports.personalizeFlow = async (req, res) => {
  try {
    const { goals = [] } = req.body || {};
    const userId = req.user?._id || null;
    const persona = journeyService.personaFor(req.user);

    const signals = await journeyService.collectSignals(userId);
    const stage = journeyService.inferStage(signals, persona);

    const journey = await UserJourney.findOne({ user: userId, status: 'in-progress' }).lean().catch(() => null);
    const done = journeyService.completedFeatureIds(signals, journey);

    const remaining = journeyService.recommendFeatures(persona, done, stage, 20);

    // Goal keywords pull matching features to the front of the flow.
    const goalText = goals.join(' ').toLowerCase();
    const customizedFlow = remaining
      .map((f) => {
        const matchesGoal = goalText && (
          goalText.includes(f.label.toLowerCase()) ||
          f.blurb.toLowerCase().split(/\s+/).some((w) => w.length > 4 && goalText.includes(w))
        );
        return { ...f, priority: matchesGoal ? 1 : 2 };
      })
      .sort((a, b) => a.priority - b.priority)
      .map((f, i) => ({
        order: i + 1,
        featureId: f.id,
        label: f.label,
        route: f.route,
        blurb: f.blurb,
        stage: f.stage
      }));

    // Persist stated goals as style preferences so recommendations (Req #16) benefit too.
    if (userId && goals.length) {
      UserProfile.updateOne(
        { userId },
        { $addToSet: { stylePreferences: { $each: goals.map(String) } } },
        { upsert: true }
      ).catch(() => {});
    }

    return res.json({ success: true, data: { persona, stage, customizedFlow } });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Admin journey analytics dashboard
// @route   GET /api/journey/analytics/dashboard
// @access  Private/Admin
exports.getAnalyticsDashboard = async (req, res) => {
  try {
    const { dateRange, segment } = req.query;

    const match = {};
    if (segment && SEQUENCES[segment]) match.persona = segment;
    if (dateRange) {
      const days = parseInt(dateRange, 10);
      if (!Number.isNaN(days) && days > 0) {
        match.createdAt = { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) };
      }
    }

    const totalJourneys = await UserJourney.countDocuments(match);
    const completed = await UserJourney.countDocuments({ ...match, status: 'completed' });
    const abandoned = await UserJourney.countDocuments({ ...match, status: 'abandoned' });
    const converted = await UserJourney.countDocuments({ ...match, 'conversions.0': { $exists: true } });

    const durationRows = await UserJourney.find({ ...match, totalDuration: { $gt: 0 } })
      .select('totalDuration').limit(500).lean();
    const averageDuration = durationRows.length
      ? durationRows.reduce((s, d) => s + d.totalDuration, 0) / durationRows.length
      : 0;

    const stageRows = await UserJourney.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      { $group: { _id: '$currentStage', count: { $sum: 1 } } }
    ]);
    const byStage = STAGES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    stageRows.forEach((r) => { if (r._id && byStage[r._id] !== undefined) byStage[r._id] = r.count; });

    const personaRows = await UserJourney.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      { $group: { _id: '$persona', count: { $sum: 1 } } }
    ]);

    const deviceRows = await UserJourney.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      { $group: { _id: '$device', count: { $sum: 1 } } }
    ]);

    const featureRows = await UserJourney.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      { $unwind: '$stepsCompleted' },
      { $match: { 'stepsCompleted.feature': { $ne: null } } },
      { $group: { _id: '$stepsCompleted.feature', uses: { $sum: 1 } } },
      { $sort: { uses: -1 } }
    ]);
    const featureUsage = featureRows.map((r) => ({
      featureId: r._id,
      label: FEATURES[r._id]?.label || r._id,
      uses: r.uses
    }));

    const guidanceRows = await UserJourney.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      {
        $group: {
          _id: null,
          shown: { $sum: '$guidance.shown' },
          accepted: { $sum: '$guidance.accepted' },
          ignored: { $sum: '$guidance.ignored' }
        }
      }
    ]);
    const { _id: _guidanceId, ...guidance } = guidanceRows[0] || { shown: 0, accepted: 0, ignored: 0 };

    // Biggest stage-to-stage drop-off, so admins see where users stall.
    const cumulative = STAGES.map((stage, i) => ({
      stage,
      count: STAGES.slice(i).reduce((sum, s) => sum + byStage[s], 0)
    }));
    let bottleneck = null;
    for (let i = 0; i < cumulative.length - 1; i++) {
      const from = cumulative[i];
      const to = cumulative[i + 1];
      if (from.count === 0) continue;
      const dropOff = ((from.count - to.count) / from.count) * 100;
      if (!bottleneck || dropOff > bottleneck.dropOffRate) {
        bottleneck = { from: from.stage, to: to.stage, dropOffRate: Number(dropOff.toFixed(2)) };
      }
    }

    return res.json({
      success: true,
      data: {
        totalJourneys,
        completed,
        abandoned,
        converted,
        completionRate: totalJourneys ? Number(((completed / totalJourneys) * 100).toFixed(2)) : 0,
        conversionRate: totalJourneys ? Number(((converted / totalJourneys) * 100).toFixed(2)) : 0,
        averageDuration: journeyService.formatDuration(averageDuration),
        byStage,
        byPersona: personaRows.map((r) => ({ persona: r._id || 'unknown', count: r.count })),
        byDevice: deviceRows.map((r) => ({ device: r._id || 'unknown', count: r.count })),
        featureUsage,
        guidance: {
          ...guidance,
          acceptanceRate: guidance.shown ? Number(((guidance.accepted / guidance.shown) * 100).toFixed(2)) : 0
        },
        bottleneck
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Seed/refresh the reference feature sequences
// @route   POST /api/journey/sequences/sync
// @access  Private/Admin
exports.syncSequences = async (req, res) => {
  try {
    const results = [];
    for (const [persona, ids] of Object.entries(SEQUENCES)) {
      if (!ids.length) continue;
      const doc = await FeatureSequence.findOneAndUpdate(
        { sequenceName: `${persona}-default` },
        {
          sequenceName: `${persona}-default`,
          description: `Default reference journey for ${persona}`,
          persona,
          features: ids.map((id, index) => ({
            featureId: id,
            order: index + 1,
            label: getFeature(id)?.label || id,
            optional: false
          }))
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      results.push({ sequenceName: doc.sequenceName, features: doc.features.length });
    }
    return res.json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
