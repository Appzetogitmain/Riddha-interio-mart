const B2BLead = require('../models/B2BLead');

// @desc    Create a new B2B Lead
// @route   POST /api/b2b-leads
// @access  Public
exports.createLead = async (req, res, next) => {
  try {
    const lead = await B2BLead.create(req.body);

    // Auto-create or update a professional User so they appear in the "Hire" pages
    const professionalProfessions = ['Interior Designer', 'Contractor', 'Architect', 'Designer', 'Builder'];
    if (professionalProfessions.includes(req.body.profession)) {
      const categoryMap = {
        'Interior Designer': 'Designer',
        'Designer': 'Designer',
        'Contractor': 'Contractor',
        'Builder': 'Architect',
        'Architect': 'Architect'
      };

      const User = require('../models/User');
      const category = categoryMap[req.body.profession] || 'Designer';

      // Check if user already exists
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        // Update existing user's professional profile
        existingUser.professionalProfile = {
          isProfessional: true,
          category: category,
          rating: existingUser.professionalProfile?.rating || 5.0,
          availabilityStatus: true
        };
        if (req.body.phone && !existingUser.phone) {
          existingUser.phone = req.body.phone;
        }
        await existingUser.save();
        console.log(`[B2BLead] Updated professionalProfile for existing user: ${req.body.email} as ${category}`);
      } else if (req.body.email) {
        // Create new user with professional profile
        await User.create({
          fullName: req.body.fullName || 'New Professional',
          email: req.body.email,
          password: 'Password123!', // Dummy password, hashed by User model pre-save hook
          phone: req.body.phone || '',
          userType: 'customer',
          isEmailVerified: true,
          professionalProfile: {
            isProfessional: true,
            category: category,
            rating: 5.0,
            availabilityStatus: true
          }
        });
        console.log(`[B2BLead] Created new professional User: ${req.body.email} as ${category}`);
      }
    }

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    console.error('[B2BLead] createLead error:', err.message);
    next(err);
  }
};

// @desc    Get all B2B Leads
// @route   GET /api/b2b-leads
// @access  Private/Admin
exports.getLeads = async (req, res, next) => {
  try {
    const leads = await B2BLead.find().sort('-createdAt').lean();
    res.status(200).json({ success: true, data: leads });
  } catch (err) {
    next(err);
  }
};

// @desc    Update B2B Lead status
// @route   PUT /api/b2b-leads/:id/status
// @access  Private/Admin
exports.updateLeadStatus = async (req, res, next) => {
  try {
    const lead = await B2BLead.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    res.status(200).json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

// @desc    Sync all B2B Leads to professional User profiles (retroactive fix)
// @route   POST /api/b2b-leads/sync-professionals
// @access  Private/Admin
exports.syncLeadsToProfessionals = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const categoryMap = {
      'Interior Designer': 'Designer',
      'Designer': 'Designer',
      'Contractor': 'Contractor',
      'Builder': 'Architect',
      'Architect': 'Architect'
    };

    const professionalProfessions = Object.keys(categoryMap);
    const leads = await B2BLead.find({ profession: { $in: professionalProfessions }, email: { $exists: true, $ne: '' } });

    let created = 0, updated = 0, skipped = 0;

    for (const lead of leads) {
      const category = categoryMap[lead.profession] || 'Designer';
      const existingUser = await User.findOne({ email: lead.email });

      if (existingUser) {
        // Update professional profile
        existingUser.professionalProfile = {
          isProfessional: true,
          category: category,
          rating: existingUser.professionalProfile?.rating || 5.0,
          availabilityStatus: true
        };
        await existingUser.save();
        updated++;
      } else {
        // Create new user with professional profile
        try {
          await User.create({
            fullName: lead.fullName || 'Professional',
            email: lead.email,
            password: 'Password123!',
            phone: lead.phone || '',
            userType: 'customer',
            isEmailVerified: true,
            professionalProfile: {
              isProfessional: true,
              category: category,
              rating: 5.0,
              availabilityStatus: true
            }
          });
          created++;
        } catch (createErr) {
          console.warn(`[B2BLead Sync] Skipped ${lead.email}: ${createErr.message}`);
          skipped++;
        }
      }
    }

    console.log(`[B2BLead Sync] Done. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    res.status(200).json({
      success: true,
      message: `Sync complete. Created ${created} new professional users, updated ${updated}, skipped ${skipped}.`
    });
  } catch (err) {
    console.error('[B2BLead Sync] Error:', err.message);
    next(err);
  }
};
