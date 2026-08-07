const mongoose = require('mongoose');
const connectDB = require('../src/config/database');
const Category = require('../src/models/Category');
const Skill = require('../src/models/Skill');

const categories = [
  {
    name: 'Information Technology',
    description: 'Software development, IT infrastructure, and technology roles',
    icon: 'code',
    order: 1,
    isActive: true,
  },
  {
    name: 'Engineering',
    description: 'Civil, mechanical, electrical, and other engineering disciplines',
    icon: 'cog',
    order: 2,
    isActive: true,
  },
  {
    name: 'Healthcare & Medical',
    description: 'Doctors, nurses, pharmacists, and healthcare professionals',
    icon: 'heart-pulse',
    order: 3,
    isActive: true,
  },
  {
    name: 'Finance & Accounting',
    description: 'Banking, accounting, auditing, and financial analysis',
    icon: 'dollar-sign',
    order: 4,
    isActive: true,
  },
  {
    name: 'Sales & Marketing',
    description: 'Sales, digital marketing, branding, and business development',
    icon: 'megaphone',
    order: 5,
    isActive: true,
  },
  {
    name: 'Human Resources',
    description: 'Recruitment, training, compensation, and HR management',
    icon: 'users',
    order: 6,
    isActive: true,
  },
  {
    name: 'Education & Training',
    description: 'Teaching, tutoring, curriculum development, and educational administration',
    icon: 'graduation-cap',
    order: 7,
    isActive: true,
  },
  {
    name: 'Administrative & Office',
    description: 'Office management, secretarial, data entry, and clerical roles',
    icon: 'briefcase',
    order: 8,
    isActive: true,
  },
  {
    name: 'Customer Service',
    description: 'Call center, support, help desk, and client relations',
    icon: 'headphones',
    order: 9,
    isActive: true,
  },
  {
    name: 'Manufacturing & Production',
    description: 'Factory operations, quality control, assembly, and production management',
    icon: 'factory',
    order: 10,
    isActive: true,
  },
  {
    name: 'Construction & Real Estate',
    description: 'Construction, property management, architecture, and surveying',
    icon: 'building',
    order: 11,
    isActive: true,
  },
  {
    name: 'Transportation & Logistics',
    description: 'Supply chain, warehousing, driving, and freight management',
    icon: 'truck',
    order: 12,
    isActive: true,
  },
  {
    name: 'Hospitality & Tourism',
    description: 'Hotels, restaurants, travel, and event management',
    icon: 'utensils',
    order: 13,
    isActive: true,
  },
  {
    name: 'Creative & Design',
    description: 'Graphic design, UI/UX, video, photography, and creative arts',
    icon: 'palette',
    order: 14,
    isActive: true,
  },
  {
    name: 'Legal & Compliance',
    description: 'Lawyers, paralegals, compliance officers, and legal advisors',
    icon: 'gavel',
    order: 15,
    isActive: true,
  },
  {
    name: 'Agriculture & Environment',
    description: 'Farming, forestry, environmental science, and sustainability',
    icon: 'leaf',
    order: 16,
    isActive: true,
  },
];

const skills = [
  { name: 'JavaScript', category: 'Information Technology' },
  { name: 'TypeScript', category: 'Information Technology' },
  { name: 'React', category: 'Information Technology' },
  { name: 'Node.js', category: 'Information Technology' },
  { name: 'Python', category: 'Information Technology' },
  { name: 'Django', category: 'Information Technology' },
  { name: 'Java', category: 'Information Technology' },
  { name: 'Spring Boot', category: 'Information Technology' },
  { name: 'C#', category: 'Information Technology' },
  { name: '.NET', category: 'Information Technology' },
  { name: 'PHP', category: 'Information Technology' },
  { name: 'Laravel', category: 'Information Technology' },
  { name: 'Go', category: 'Information Technology' },
  { name: 'Rust', category: 'Information Technology' },
  { name: 'SQL', category: 'Information Technology' },
  { name: 'PostgreSQL', category: 'Information Technology' },
  { name: 'MongoDB', category: 'Information Technology' },
  { name: 'Redis', category: 'Information Technology' },
  { name: 'Docker', category: 'Information Technology' },
  { name: 'Kubernetes', category: 'Information Technology' },
  { name: 'AWS', category: 'Information Technology' },
  { name: 'Azure', category: 'Information Technology' },
  { name: 'GCP', category: 'Information Technology' },
  { name: 'Git', category: 'Information Technology' },
  { name: 'CI/CD', category: 'Information Technology' },
  { name: 'Machine Learning', category: 'Information Technology' },
  { name: 'Data Science', category: 'Information Technology' },
  { name: 'DevOps', category: 'Information Technology' },
  { name: 'Cybersecurity', category: 'Information Technology' },
  { name: 'Mobile Development', category: 'Information Technology' },
  { name: 'React Native', category: 'Information Technology' },
  { name: 'Flutter', category: 'Information Technology' },
  { name: 'Swift', category: 'Information Technology' },
  { name: 'Kotlin', category: 'Information Technology' },
  { name: 'UI/UX Design', category: 'Creative & Design' },
  { name: 'Figma', category: 'Creative & Design' },
  { name: 'Adobe Photoshop', category: 'Creative & Design' },
  { name: 'Adobe Illustrator', category: 'Creative & Design' },
  { name: 'Adobe After Effects', category: 'Creative & Design' },
  { name: 'Video Editing', category: 'Creative & Design' },
  { name: 'Motion Graphics', category: 'Creative & Design' },
  { name: 'Graphic Design', category: 'Creative & Design' },
  { name: 'Branding', category: 'Creative & Design' },
  { name: 'Digital Marketing', category: 'Sales & Marketing' },
  { name: 'SEO', category: 'Sales & Marketing' },
  { name: 'SEM', category: 'Sales & Marketing' },
  { name: 'Social Media Marketing', category: 'Sales & Marketing' },
  { name: 'Content Marketing', category: 'Sales & Marketing' },
  { name: 'Email Marketing', category: 'Sales & Marketing' },
  { name: 'Google Analytics', category: 'Sales & Marketing' },
  { name: 'Sales', category: 'Sales & Marketing' },
  { name: 'Business Development', category: 'Sales & Marketing' },
  { name: 'Account Management', category: 'Sales & Marketing' },
  { name: 'CRM', category: 'Sales & Marketing' },
  { name: 'Project Management', category: 'Administrative & Office' },
  { name: 'Agile', category: 'Administrative & Office' },
  { name: 'Scrum', category: 'Administrative & Office' },
  { name: 'Jira', category: 'Administrative & Office' },
  { name: 'Microsoft Office', category: 'Administrative & Office' },
  { name: 'Data Entry', category: 'Administrative & Office' },
  { name: 'Customer Support', category: 'Customer Service' },
  { name: 'Technical Support', category: 'Customer Service' },
  { name: 'Call Center', category: 'Customer Service' },
  { name: 'Help Desk', category: 'Customer Service' },
  { name: 'Recruitment', category: 'Human Resources' },
  { name: 'Talent Acquisition', category: 'Human Resources' },
  { name: 'Employee Relations', category: 'Human Resources' },
  { name: 'Training & Development', category: 'Human Resources' },
  { name: 'Compensation & Benefits', category: 'Human Resources' },
  { name: 'HRIS', category: 'Human Resources' },
  { name: 'Accounting', category: 'Finance & Accounting' },
  { name: 'Financial Analysis', category: 'Finance & Accounting' },
  { name: 'Auditing', category: 'Finance & Accounting' },
  { name: 'Taxation', category: 'Finance & Accounting' },
  { name: 'QuickBooks', category: 'Finance & Accounting' },
  { name: 'SAP', category: 'Finance & Accounting' },
  { name: 'Civil Engineering', category: 'Engineering' },
  { name: 'Mechanical Engineering', category: 'Engineering' },
  { name: 'Electrical Engineering', category: 'Engineering' },
  { name: 'AutoCAD', category: 'Engineering' },
  { name: 'SolidWorks', category: 'Engineering' },
  { name: 'Project Engineering', category: 'Engineering' },
  { name: 'Nursing', category: 'Healthcare & Medical' },
  { name: 'Medical Laboratory', category: 'Healthcare & Medical' },
  { name: 'Pharmacy', category: 'Healthcare & Medical' },
  { name: 'Public Health', category: 'Healthcare & Medical' },
  { name: 'Teaching', category: 'Education & Training' },
  { name: 'Curriculum Development', category: 'Education & Training' },
  { name: 'E-Learning', category: 'Education & Training' },
];

async function seedData() {
  try {
    await connectDB();
    console.log('Connected to database');

    console.log('Seeding categories...');
    for (const cat of categories) {
      const existing = await Category.findOne({ name: cat.name });
      if (!existing) {
        await Category.create(cat);
        console.log(`Created category: ${cat.name}`);
      } else {
        console.log(`Category already exists: ${cat.name}`);
      }
    }

    console.log('Seeding skills...');
    for (const skill of skills) {
      const existing = await Skill.findOne({ name: skill.name });
      if (!existing) {
        await Skill.create(skill);
        console.log(`Created skill: ${skill.name}`);
      } else {
        console.log(`Skill already exists: ${skill.name}`);
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedData();