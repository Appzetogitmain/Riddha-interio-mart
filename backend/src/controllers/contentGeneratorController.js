const GeneratedContent = require('../models/GeneratedContent');
const ContentTemplate = require('../models/ContentTemplate');
const Product = require('../models/Product');
const geminiContentGeneratorService = require('../services/geminiContentGeneratorService');

// 1. Generate Content via Gemini AI Prompts
exports.generateContent = async (req, res, next) => {
  try {
    const {
      productId,
      name,
      category,
      features,
      materials,
      targetAudience,
      contentType = 'description',
      platform = 'product_listing',
      tone = 'professional',
      style = 'sales',
      length = 'medium',
      generateVariants = true
    } = req.body;

    const sellerId = req.user._id;

    let generatedBody = '';
    let title = '';
    let keywords = [];
    let hashtags = [];
    let metadata = {};
    let variants = [];

    // Route to proper Gemini AI prompt generator
    if (contentType === 'title') {
      const titles = await geminiContentGeneratorService.generateProductTitle({ name, category, features, tone }, sellerId);
      title = titles.seoTitle;
      generatedBody = titles.marketingTitle;
      metadata = titles;
    } else if (contentType === 'description') {
      const desc = await geminiContentGeneratorService.generateProductDescription({ name, category, features, materials, targetAudience, tone, length }, sellerId);
      title = desc.openingHook;
      generatedBody = desc.bodyDescription;
      metadata = desc;
    } else if (contentType === 'meta_description') {
      const meta = await geminiContentGeneratorService.generateMetaDescription({ name, price: req.body.price }, sellerId);
      generatedBody = meta.metaDescription;
      metadata = meta;
    } else if (contentType === 'hashtags_keywords') {
      const hk = await geminiContentGeneratorService.generateHashtagsAndKeywords({ name, category, style }, sellerId);
      hashtags = hk.instagramHashtags || [];
      keywords = hk.seoKeywords || [];
      generatedBody = `Instagram Hashtags:\n${hashtags.join(' ')}\n\nSEO Keywords:\n${keywords.join(', ')}`;
      metadata = hk;
    } else if (contentType === 'social_post') {
      const social = await geminiContentGeneratorService.generateSocialMediaPost({ name, platform }, sellerId);
      generatedBody = social.instagramCaption || social.facebookPost;
      hashtags = social.recommendedHashtags || [];
      metadata = social;
    } else if (contentType === 'email_subject' || contentType === 'email_body') {
      const email = await geminiContentGeneratorService.generateEmailCampaign({ name, offer: req.body.offer }, sellerId);
      title = email.subjectLines?.[0] || 'Promotional Offer';
      generatedBody = email.emailHtml;
      metadata = email;
    } else if (contentType === 'blog_post') {
      const blog = await geminiContentGeneratorService.generateBlogArticle({ name, keyword: req.body.keyword }, sellerId);
      title = blog.title;
      generatedBody = blog.articleMarkdown;
      metadata = blog;
    }

    // Generate A/B Variants if requested
    if (generateVariants) {
      const ab = await geminiContentGeneratorService.generateABTestVariants({ name }, sellerId);
      if (ab.variantA && ab.variantB) {
        variants = [
          { variantId: 'Variant A', content: ab.variantA.content, tone: 'professional', style: ab.variantA.approach, predictedCtr: ab.variantA.predictedCtr },
          { variantId: 'Variant B', content: ab.variantB.content, tone: 'luxury', style: ab.variantB.approach, predictedCtr: ab.variantB.predictedCtr }
        ];
      }
    }

    const newContent = new GeneratedContent({
      sellerId,
      productId,
      contentType,
      platform,
      content: {
        title: title || name || 'Generated Content',
        body: generatedBody,
        metadata,
        wordCount: generatedBody.split(/\s+/).length || 0,
        keywords,
        hashtags
      },
      tone,
      style,
      length,
      variants,
      status: 'draft'
    });

    await newContent.save();

    res.status(201).json({
      success: true,
      message: 'Content generated successfully with Gemini AI',
      data: newContent
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Content by ID
exports.getContentById = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const content = await GeneratedContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: 'Generated content not found' });
    }
    res.status(200).json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
};

// 3. Get Seller Content Library
exports.getSellerContentLibrary = async (req, res, next) => {
  try {
    const { contentType, status, limit = 20, offset = 0 } = req.query;
    const query = { sellerId: req.user._id };

    if (contentType && contentType !== 'all') query.contentType = contentType;
    if (status && status !== 'all') query.status = status;

    const contentList = await GeneratedContent.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit));

    const total = await GeneratedContent.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        content: contentList,
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Generated Content
exports.updateContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { body, title, status } = req.body;

    const item = await GeneratedContent.findById(contentId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }

    if (body) item.content.body = body;
    if (title) item.content.title = title;
    if (status) item.status = status;

    await item.save();

    res.status(200).json({
      success: true,
      message: 'Content updated successfully',
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Generated Content
exports.deleteContent = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    await GeneratedContent.findByIdAndDelete(contentId);
    res.status(200).json({ success: true, message: 'Content deleted' });
  } catch (error) {
    next(error);
  }
};

// 6. 1-Click Publish Content to Product Listing
exports.publishContentToProduct = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const { productId, targetField = 'description' } = req.body;

    const item = await GeneratedContent.findById(contentId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Generated content not found' });
    }

    const targetProductId = productId || item.productId;
    if (targetProductId) {
      const product = await Product.findById(targetProductId);
      if (product) {
        if (targetField === 'title' || targetField === 'name') product.name = item.content.title || item.content.body;
        if (targetField === 'description') product.description = item.content.body;
        await product.save();
      }
    }

    item.status = 'published';
    item.usedIn = {
      productId: targetProductId,
      publishedAt: new Date(),
      platform: 'product_listing'
    };
    await item.save();

    res.status(200).json({
      success: true,
      message: `Content published to product listing successfully!`,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// 7. Bulk Content Generator Across Multiple Products
exports.bulkGenerateContent = async (req, res, next) => {
  try {
    const { productIds = [], contentType = 'description', tone = 'professional' } = req.body;
    const generatedIds = [];

    for (const pid of productIds) {
      const product = await Product.findById(pid).catch(() => null);
      const name = product?.name || 'Interior Item';

      const aiDesc = await geminiContentGeneratorService.generateProductDescription({ name, tone }, req.user._id);

      const newItem = new GeneratedContent({
        sellerId: req.user._id,
        productId: pid,
        contentType,
        content: {
          title: name,
          body: aiDesc.bodyDescription || 'Bulk generated product description.'
        },
        tone,
        status: 'draft'
      });
      await newItem.save();
      generatedIds.push(newItem._id);
    }

    res.status(201).json({
      success: true,
      message: `Bulk generated content for ${generatedIds.length} products`,
      data: { generatedCount: generatedIds.length, contentIds: generatedIds }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Create Content Template
exports.createContentTemplate = async (req, res, next) => {
  try {
    const { templateName, contentType, tone, style, prompt } = req.body;
    const template = new ContentTemplate({
      sellerId: req.user._id,
      templateName: templateName || 'Custom Template',
      contentType: contentType || 'description',
      tone: tone || 'luxury',
      style: style || 'sales',
      prompt: prompt || 'Write luxury product copy'
    });
    await template.save();

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    next(error);
  }
};

// 9. Get Seller Templates
exports.getSellerTemplates = async (req, res, next) => {
  try {
    const templates = await ContentTemplate.find({ sellerId: req.user._id });
    res.status(200).json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    next(error);
  }
};
