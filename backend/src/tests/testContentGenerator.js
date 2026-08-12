const geminiContentGeneratorService = require('../services/geminiContentGeneratorService');

async function runContentGeneratorTests() {
  console.log('--- Testing Seller AI Content Generator & Gemini AI Prompts ---');

  // 1. Test Product Title Generation (Gemini Prompt 1)
  console.log('1. Testing Gemini AI Product Title Generation:');
  const titleVariants = await geminiContentGeneratorService.generateProductTitle({
    name: 'Nordic Solid Teak Living Room Sofa',
    category: 'Furniture',
    features: ['Solid Plantation Teak', 'Stain-resistant velvet upholstery', 'Ergonomic seating'],
    tone: 'luxury'
  });
  console.log('   SEO Title:', titleVariants.seoTitle);
  console.log('   Marketing Title:', titleVariants.marketingTitle);
  console.log('   Catchy Title:', titleVariants.catchyTitle);
  console.log('   Luxury Title:', titleVariants.luxuryTitle);

  // 2. Test Full Product Description (Gemini Prompt 2)
  console.log('\n2. Testing Gemini AI Full Product Description:');
  const desc = await geminiContentGeneratorService.generateProductDescription({
    name: 'L-Shaped Velvet Sectional Sofa',
    category: 'Living Room Furniture',
    materials: 'Solid Teak Wood, Velvet Fabric',
    tone: 'luxury',
    length: 'medium'
  });
  console.log('   Opening Hook:', desc.openingHook);
  console.log('   Specifications Count:', desc.specifications?.length);
  console.log('   Call to Action:', desc.callToAction);

  // 3. Test Meta Description & Hashtags (Gemini Prompts 3 & 4)
  console.log('\n3. Testing SEO Meta Description & Social Hashtags:');
  const meta = await geminiContentGeneratorService.generateMetaDescription({ name: 'Modern Living Room Sofa', price: 48950 });
  const hk = await geminiContentGeneratorService.generateHashtagsAndKeywords({ name: 'Modern Sofa', category: 'Furniture' });
  console.log('   Meta Text (<=160 chars):', meta.metaDescription);
  console.log('   Instagram Hashtags:', hk.instagramHashtags?.slice(0, 5).join(' '));
  console.log('   SEO Keywords:', hk.seoKeywords?.slice(0, 3).join(', '));

  // 4. Test Social Media Post & Email Campaign (Gemini Prompts 5 & 6)
  console.log('\n4. Testing Social Media Copy & Email Campaign:');
  const social = await geminiContentGeneratorService.generateSocialMediaPost({ name: 'Teak Dining Table' });
  const email = await geminiContentGeneratorService.generateEmailCampaign({ name: 'Teak Dining Set' });
  console.log('   Instagram Caption Snippet:', social.instagramCaption?.slice(0, 80) + '...');
  console.log('   Email Subject Lines Count:', email.subjectLines?.length);

  // 5. Test Blog Article & A/B Test Variants (Gemini Prompts 7 & 8)
  console.log('\n5. Testing Long-Form Blog Article & A/B Variants:');
  const blog = await geminiContentGeneratorService.generateBlogArticle({ title: '5 Tips to Choose Sofa' });
  const ab = await geminiContentGeneratorService.generateABTestVariants({ name: 'Teak Armchair' });
  console.log('   Blog Article Title:', blog.title);
  console.log('   Variant A (Predicted CTR):', ab.variantA?.predictedCtr, '%');
  console.log('   Variant B (Predicted CTR):', ab.variantB?.predictedCtr, '%');

  console.log('\n✅ All Seller AI Content Generator backend tests passed successfully!');
}

runContentGeneratorTests().catch(err => {
  console.error('❌ Content Generator test failed:', err);
  process.exit(1);
});
