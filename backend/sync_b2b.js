const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./src/config/db');
const B2BLead = require('./src/models/B2BLead');
const User = require('./src/models/User');

const categoryMap = {
  'Interior Designer': 'Designer',
  'Designer': 'Designer',
  'Contractor': 'Contractor',
  'Builder': 'Architect',
  'Architect': 'Architect'
};

async function runSync() {
  try {
    await connectDB();

    const professionalProfessions = Object.keys(categoryMap);
    const leads = await B2BLead.find({ profession: { $in: professionalProfessions } });
    console.log(`Found ${leads.length} B2B leads to inspect.`);

    let created = 0, updated = 0, skipped = 0;

    for (const lead of leads) {
      if (!lead.email) {
        skipped++;
        continue;
      }
      const category = categoryMap[lead.profession] || 'Designer';
      const existingUser = await User.findOne({ email: lead.email });

      if (existingUser) {
        existingUser.professionalProfile = {
          isProfessional: true,
          category: category,
          rating: existingUser.professionalProfile?.rating || 5.0,
          availabilityStatus: true
        };
        await existingUser.save();
        console.log(`Updated user ${lead.email} as ${category}`);
        updated++;
      } else {
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
          console.log(`Created user ${lead.email} as ${category}`);
          created++;
        } catch (err) {
          console.error(`Failed to create ${lead.email}: ${err.message}`);
          skipped++;
        }
      }
    }

    console.log(`SYNC FINISHED. Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Sync failed:', err);
    process.exit(1);
  }
}

runSync();
