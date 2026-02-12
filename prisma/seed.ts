import { PrismaClient, Site, Role, MainRCA, CodeScope, CodeStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default ADMIN user
  const hashedPassword = await bcrypt.hash('Admin@123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@qagovernance.com' },
    update: {},
    create: {
      email: 'admin@qagovernance.com',
      fullName: 'System Administrator',
      password: hashedPassword,
      site: Site.UAE,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create sample users for each site
  const managerUAE = await prisma.user.upsert({
    where: { email: 'manager.uae@qagovernance.com' },
    update: {},
    create: {
      email: 'manager.uae@qagovernance.com',
      fullName: 'UAE Manager',
      password: hashedPassword,
      site: Site.UAE,
      role: Role.MANAGER,
      isActive: true,
    },
  });

  const leadEG = await prisma.user.upsert({
    where: { email: 'lead.eg@qagovernance.com' },
    update: {},
    create: {
      email: 'lead.eg@qagovernance.com',
      fullName: 'Egypt QA Lead',
      password: hashedPassword,
      site: Site.EG,
      role: Role.QA_LEAD,
      isActive: true,
    },
  });

  const memberKSA = await prisma.user.upsert({
    where: { email: 'member.ksa@qagovernance.com' },
    update: {},
    create: {
      email: 'member.ksa@qagovernance.com',
      fullName: 'KSA QA Member',
      password: hashedPassword,
      site: Site.KSA,
      role: Role.QA_MEMBER,
      isActive: true,
    },
  });

  console.log('✅ Created sample users');

  // Create sample approved RCA codes
  const rcaCode1 = await prisma.rcaCode.upsert({
    where: { id: 'rca-process-policies-bankoffer' },
    update: {},
    create: {
      id: 'rca-process-policies-bankoffer',
      scope: CodeScope.GLOBAL,
      status: CodeStatus.APPROVED,
      mainRca: MainRCA.PROCESS,
      rca1: 'Policies',
      rca2: 'Bank Offer',
      rca3: null,
      rca4: null,
      rca5: null,
      definition: 'Root cause related to bank offer policies that affect customer transactions or refunds.',
      useWhen: 'Use when the issue is caused by bank-specific promotional offers, cashback policies, or payment terms that were not properly communicated or applied.',
      dontUseWhen: 'Do not use for general payment failures or technical issues with payment gateways. Use Technology > Payment Gateway instead.',
      examples: JSON.stringify([
        'Customer was promised 10% cashback but bank policy changed mid-transaction',
        'EMI option not available due to bank policy restrictions',
        'Bank offer code expired but was still displayed on the platform'
      ]),
      tags: JSON.stringify(['Payment', 'Refund', 'Bank', 'Offer', 'Policy']),
      createdById: adminUser.id,
      approvedById: adminUser.id,
      version: 1,
    },
  });

  const rcaCode2 = await prisma.rcaCode.upsert({
    where: { id: 'rca-technology-booking-payment' },
    update: {},
    create: {
      id: 'rca-technology-booking-payment',
      scope: CodeScope.GLOBAL,
      status: CodeStatus.APPROVED,
      mainRca: MainRCA.TECHNOLOGY,
      rca1: 'Booking Failure',
      rca2: 'Payment Gateway',
      rca3: null,
      rca4: null,
      rca5: null,
      definition: 'Technical failure in the payment gateway integration causing booking failures or payment processing errors.',
      useWhen: 'Use when the booking failed due to payment gateway timeout, API errors, or integration issues between our system and the payment provider.',
      dontUseWhen: 'Do not use for user errors (wrong card details), insufficient funds, or bank-side rejections. Use Customer > Payment Error for user-side issues.',
      examples: JSON.stringify([
        'Payment gateway returned 500 error during transaction',
        'Timeout occurred while waiting for payment confirmation',
        'Duplicate transaction created due to gateway retry logic'
      ]),
      tags: JSON.stringify(['Technology', 'Payment', 'Booking', 'Gateway', 'Integration']),
      createdById: adminUser.id,
      approvedById: adminUser.id,
      version: 1,
    },
  });

  const rcaCode3 = await prisma.rcaCode.upsert({
    where: { id: 'rca-agent-knowledge-wronginfo' },
    update: {},
    create: {
      id: 'rca-agent-knowledge-wronginfo',
      scope: CodeScope.GLOBAL,
      status: CodeStatus.APPROVED,
      mainRca: MainRCA.AGENT,
      rca1: 'Knowledge',
      rca2: 'Wrong/Incomplete Info',
      rca3: null,
      rca4: null,
      rca5: null,
      definition: 'Agent provided incorrect or incomplete information to the customer due to knowledge gaps or outdated information.',
      useWhen: 'Use when the agent gave wrong information about policies, procedures, product features, or provided incomplete guidance that led to customer dissatisfaction.',
      dontUseWhen: 'Do not use when the information was correct but the customer misunderstood. Use Customer > Misunderstanding instead. Also do not use if the knowledge base itself was wrong - use Process > Documentation instead.',
      examples: JSON.stringify([
        'Agent quoted wrong cancellation policy leading to customer complaint',
        'Agent failed to mention important terms and conditions',
        'Agent provided outdated pricing information'
      ]),
      tags: JSON.stringify(['Agent', 'Knowledge', 'Training', 'Information', 'NPS']),
      createdById: adminUser.id,
      approvedById: adminUser.id,
      version: 1,
    },
  });

  // Create a site-specific code for UAE
  const rcaCode4 = await prisma.rcaCode.upsert({
    where: { id: 'rca-process-uae-vat' },
    update: {},
    create: {
      id: 'rca-process-uae-vat',
      scope: CodeScope.SITE,
      site: Site.UAE,
      status: CodeStatus.APPROVED,
      mainRca: MainRCA.PROCESS,
      rca1: 'Compliance',
      rca2: 'VAT Calculation',
      rca3: null,
      rca4: null,
      rca5: null,
      definition: 'Issues related to UAE VAT calculation, display, or compliance requirements.',
      useWhen: 'Use when the issue is specifically related to UAE VAT (5%) calculation errors, missing VAT on invoices, or VAT compliance issues.',
      dontUseWhen: 'Do not use for general pricing errors or tax issues in other countries.',
      examples: JSON.stringify([
        'VAT not displayed correctly on UAE customer invoice',
        'VAT calculation error on multi-item booking'
      ]),
      tags: JSON.stringify(['UAE', 'VAT', 'Tax', 'Compliance', 'Invoice']),
      createdById: adminUser.id,
      approvedById: adminUser.id,
      version: 1,
    },
  });

  // Create a pending proposal for testing
  const pendingProposal = await prisma.rcaCode.upsert({
    where: { id: 'rca-pending-customer-expectation' },
    update: {},
    create: {
      id: 'rca-pending-customer-expectation',
      scope: CodeScope.GLOBAL,
      status: CodeStatus.PENDING,
      mainRca: MainRCA.CUSTOMER,
      rca1: 'Expectation Mismatch',
      rca2: 'Service Level',
      rca3: null,
      rca4: null,
      rca5: null,
      definition: 'Customer had unrealistic expectations about service levels that were not aligned with actual service offerings.',
      useWhen: 'Use when customer complaint stems from expecting faster response times, additional services, or features not included in their purchase.',
      dontUseWhen: 'Do not use when we actually failed to meet our stated SLAs or promised service levels.',
      examples: JSON.stringify([
        'Customer expected 24/7 phone support but only email support was included',
        'Customer expected same-day delivery for standard shipping option'
      ]),
      tags: JSON.stringify(['Customer', 'Expectation', 'Service', 'SLA']),
      createdById: memberKSA.id,
      version: 1,
    },
  });

  console.log('✅ Created sample RCA codes');

  // Create a sample comment on the pending proposal
  await prisma.comment.create({
    data: {
      entityType: 'proposal',
      entityId: pendingProposal.id,
      content: 'I think this is a valid RCA code. We see this pattern frequently in our KSA operations.',
      reaction: 'AGREE',
      userId: leadEG.id,
      rcaCodeId: pendingProposal.id,
    },
  });

  console.log('✅ Created sample comment');

  // Create audit log entries
  await prisma.auditLog.createMany({
    data: [
      {
        action: 'CODE_APPROVED',
        entityType: 'rca_code',
        entityId: rcaCode1.id,
        before: null,
        after: JSON.parse(JSON.stringify(rcaCode1)),
        actorId: adminUser.id,
      },
      {
        action: 'CODE_APPROVED',
        entityType: 'rca_code',
        entityId: rcaCode2.id,
        before: null,
        after: JSON.parse(JSON.stringify(rcaCode2)),
        actorId: adminUser.id,
      },
      {
        action: 'CODE_APPROVED',
        entityType: 'rca_code',
        entityId: rcaCode3.id,
        before: null,
        after: JSON.parse(JSON.stringify(rcaCode3)),
        actorId: adminUser.id,
      },
      {
        action: 'PROPOSAL_CREATED',
        entityType: 'rca_code',
        entityId: pendingProposal.id,
        before: null,
        after: JSON.parse(JSON.stringify(pendingProposal)),
        actorId: memberKSA.id,
      },
    ],
  });

  console.log('✅ Created audit log entries');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin: admin@qagovernance.com / Admin@123');
  console.log('   Manager (UAE): manager.uae@qagovernance.com / Admin@123');
  console.log('   QA Lead (EG): lead.eg@qagovernance.com / Admin@123');
  console.log('   QA Member (KSA): member.ksa@qagovernance.com / Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
