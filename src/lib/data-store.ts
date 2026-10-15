// Centralized in-memory & persistent data store for Real Estate Admin

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'landlord' | 'agent' | 'tenant'
  landlordId?: number
  agentId?: number
  avatar?: string
  phone?: string
  createdAt: string
}

export interface Landlord {
  id: number
  userId?: string
  name: string
  phone: string
  email: string
  address: string
}

export interface Property {
  id: number
  landlordId: number
  assignedAgentId: number
  name: string
  address: string
  city: string
  state: string
  type: 'Residential' | 'Commercial'
  status: 'Active' | 'Vacant' | 'Needs Repair'
  managementFee: number
}

export interface Tenant {
  id: number
  propertyId: number
  name: string
  phone?: string
  email?: string
  rentAmount: number
  lastPaymentDate: string
  nextDueDate: string
  status: 'Current' | 'Overdue' | 'Vacated'
  vacatedDate?: string
  notes?: string
}

export interface RentPayment {
  id: number
  receiptNo: string
  propertyId: number
  tenantId: number
  amountPaid: number
  debit: number
  credit: number
  balance: number
  paymentDate: string
  paymentMethod: string
}

export interface ExpenseRecord {
  id: number
  receiptNo: string
  propertyId: number
  description: string
  period: string
  debit: number
  credit: number
  balance: number
  createdAt: string
  category?: string
}

export interface MaintenanceRequest {
  id: number
  propertyId: number
  landlordId: number
  agentId: number
  requestedByName: string
  title: string
  description: string
  category: 'Plumbing' | 'Electrical' | 'Structural' | 'Painting' | 'HVAC' | 'General'
  priority: 'Low' | 'Medium' | 'High' | 'Emergency'
  status: 'Needs Repair' | 'In Progress' | 'Repaired'
  estimatedCost: number
  actualCost?: number
  reportedDate: string
  repairedDate?: string
  notes?: string
}

// Initial seed data
const INITIAL_LANDLORDS: Landlord[] = [
  { id: 1, name: 'Chief Adebayo (Client Landlord 1)', phone: '08012345670', email: 'landlord1@example.com', address: '10 Queens Drive, Ikoyi, Lagos' },
  { id: 2, name: 'Alhaji Musa (Client Landlord 2)', phone: '08012345671', email: 'landlord2@example.com', address: '14 Maitama Avenue, Abuja' },
  { id: 3, name: 'Dr. (Mrs) Okafor (Client Landlord 3)', phone: '08012345672', email: 'landlord3@example.com', address: '22 Admiralty Way, Lekki, Lagos' },
  { id: 4, name: 'Engr. Folorunsho (Client Landlord 4)', phone: '08012345673', email: 'landlord4@example.com', address: '5 Asokoro Crescent, Abuja' },
  { id: 5, name: 'Barrister Nnamdi (Client Landlord 5)', phone: '08012345674', email: 'landlord5@example.com', address: '18 GRA Ikeja, Lagos' },
]

const INITIAL_PROPERTIES: Property[] = [
  // Landlord 1 properties (Agent 1: Sarah Jenkins, Agent 2: Michael Okon)
  { id: 1, landlordId: 1, assignedAgentId: 1, name: 'Emerald Heights Suite 1A', address: 'Plot 1 Block 1, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 75000 },
  { id: 2, landlordId: 1, assignedAgentId: 1, name: 'Sapphire Commercial Plaza', address: 'Plot 2 Block 1, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Active', managementFee: 120000 },
  { id: 3, landlordId: 1, assignedAgentId: 2, name: 'Victoria Crest Court 3', address: 'Plot 3 Block 1, Victoria Island', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Needs Repair', managementFee: 65000 },
  
  // Landlord 2 properties
  { id: 4, landlordId: 2, assignedAgentId: 1, name: 'Maitama Luxury Villa 1', address: 'Plot 1 Block 2, Maitama District', city: 'Abuja', state: 'FCT', type: 'Residential', status: 'Active', managementFee: 90000 },
  { id: 5, landlordId: 2, assignedAgentId: 2, name: 'Abuja Central Offices', address: 'Plot 2 Block 2, Central Business District', city: 'Abuja', state: 'FCT', type: 'Commercial', status: 'Active', managementFee: 150000 },
  { id: 6, landlordId: 2, assignedAgentId: 2, name: 'Gwarinpa Residential Duplex', address: 'Plot 3 Block 2, Gwarinpa Estate', city: 'Abuja', state: 'FCT', type: 'Residential', status: 'Vacant', managementFee: 50000 },

  // Landlord 3 properties
  { id: 7, landlordId: 3, assignedAgentId: 1, name: 'Lekki Pearl Apartment A', address: 'Plot 1 Block 3, Admiralty Way, Lekki Phase 1', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 80000 },
  { id: 8, landlordId: 3, assignedAgentId: 2, name: 'Lekki Tech Hub Office', address: 'Plot 2 Block 3, Lekki Expressway', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Needs Repair', managementFee: 110000 },
  { id: 9, landlordId: 3, assignedAgentId: 1, name: 'Lekki Waterways Residence', address: 'Plot 3 Block 3, Lekki Waterfront', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 70000 },

  // Landlord 4 properties
  { id: 10, landlordId: 4, assignedAgentId: 1, name: 'Asokoro Diplomatic Suites', address: 'Plot 1 Block 4, Asokoro District', city: 'Abuja', state: 'FCT', type: 'Residential', status: 'Active', managementFee: 130000 },
  { id: 11, landlordId: 4, assignedAgentId: 2, name: 'Wuse 2 Retail Mall', address: 'Plot 2 Block 4, Aminu Kano Crescent, Wuse 2', city: 'Abuja', state: 'FCT', type: 'Commercial', status: 'Active', managementFee: 180000 },
  { id: 12, landlordId: 4, assignedAgentId: 1, name: 'Guzape Valley Apartments', address: 'Plot 3 Block 4, Guzape Hills', city: 'Abuja', state: 'FCT', type: 'Residential', status: 'Vacant', managementFee: 85000 },

  // Landlord 5 properties
  { id: 13, landlordId: 5, assignedAgentId: 2, name: 'Ikeja Palms Court', address: 'Plot 1 Block 5, Isaac John Street, GRA Ikeja', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 60000 },
  { id: 14, landlordId: 5, assignedAgentId: 1, name: 'Allen Corporate Tower', address: 'Plot 2 Block 5, Allen Avenue, Ikeja', city: 'Lagos', state: 'Lagos', type: 'Commercial', status: 'Active', managementFee: 140000 },
  { id: 15, landlordId: 5, assignedAgentId: 2, name: 'Maryland Family Residence', address: 'Plot 3 Block 5, Maryland Estate', city: 'Lagos', state: 'Lagos', type: 'Residential', status: 'Active', managementFee: 55000 },
]

const INITIAL_TENANTS: Tenant[] = [
  { id: 1, propertyId: 1, name: 'Dr. Kunle Balogun', phone: '08023456789', email: 'kunle.balogun@gmail.com', rentAmount: 3500000, lastPaymentDate: '2026-09-01', nextDueDate: '2027-09-01', status: 'Current' },
  { id: 2, propertyId: 2, name: 'FinTech Innovations Ltd', phone: '08034567890', email: 'finance@fintechinnovations.ng', rentAmount: 7200000, lastPaymentDate: '2026-08-15', nextDueDate: '2027-08-15', status: 'Current' },
  { id: 3, propertyId: 3, name: 'Tunde Adeyemi (Pending Renewal)', phone: '08045678901', email: 'tunde.adeyemi@yahoo.com', rentAmount: 2800000, lastPaymentDate: '2025-10-10', nextDueDate: '2026-10-10', status: 'Overdue', notes: 'Lease expired. In discussion with Agent Michael regarding bathroom repairs before renewal.' },
  { id: 4, propertyId: 4, name: 'Senator Ibrahim Danjuma', phone: '08056789012', email: 'i.danjuma@senate.gov.ng', rentAmount: 6000000, lastPaymentDate: '2026-07-01', nextDueDate: '2027-07-01', status: 'Current' },
  { id: 5, propertyId: 5, name: 'Apex Consulting West Africa', phone: '08067890123', email: 'hq@apexconsulting.org', rentAmount: 8500000, lastPaymentDate: '2026-06-15', nextDueDate: '2027-06-15', status: 'Current' },
  { id: 6, propertyId: 6, name: 'Emeka Nwosu (Former Tenant)', phone: '08078901234', email: 'enwosu@gmail.com', rentAmount: 2400000, lastPaymentDate: '2026-01-10', nextDueDate: '2026-07-10', status: 'Vacated', vacatedDate: '2026-08-31', notes: 'Vacated at end of August 2026. Handover keys received by Agent Michael Okon.' },
  { id: 7, propertyId: 7, name: 'Mrs. Folake Craig', phone: '08089012345', email: 'folake.craig@gmail.com', rentAmount: 4200000, lastPaymentDate: '2026-09-12', nextDueDate: '2027-09-12', status: 'Current' },
  { id: 8, propertyId: 8, name: 'Nexus Cloud Systems', phone: '08090123456', email: 'support@nexuscloud.io', rentAmount: 6800000, lastPaymentDate: '2026-04-01', nextDueDate: '2027-04-01', status: 'Current', notes: 'Reported air conditioning inverter breakdown.' },
  { id: 9, propertyId: 9, name: 'Captain Samuel Briggs', phone: '08101234567', email: 'samuel.briggs@nigerianairways.net', rentAmount: 3800000, lastPaymentDate: '2026-08-20', nextDueDate: '2027-08-20', status: 'Current' },
  { id: 10, propertyId: 10, name: 'Embassy Cultural Attaché', phone: '08112345678', email: 'attache@nordicmission.org', rentAmount: 9500000, lastPaymentDate: '2026-05-01', nextDueDate: '2027-05-01', status: 'Current' },
  { id: 11, propertyId: 11, name: 'Blue Ribbon Supermart Ltd', phone: '08123456789', email: 'accounts@blueribbon.ng', rentAmount: 11000000, lastPaymentDate: '2026-07-15', nextDueDate: '2027-07-15', status: 'Current' },
  { id: 12, propertyId: 12, name: 'Mr. & Mrs. Olumide Johnson', phone: '08134567890', email: 'ojohnson@gmail.com', rentAmount: 3200000, lastPaymentDate: '2026-02-15', nextDueDate: '2026-08-15', status: 'Vacated', vacatedDate: '2026-09-15', notes: 'Relocated to Canada. Property inspected by Agent Sarah.' },
  { id: 13, propertyId: 13, name: 'Engr. Donald Bassey', phone: '08145678901', email: 'dbassey@energytech.com', rentAmount: 3000000, lastPaymentDate: '2026-09-05', nextDueDate: '2027-09-05', status: 'Current' },
  { id: 14, propertyId: 14, name: 'Vanguard Media House', phone: '08156789012', email: 'finance@vanguardoffices.ng', rentAmount: 7800000, lastPaymentDate: '2026-06-01', nextDueDate: '2027-06-01', status: 'Current' },
  { id: 15, propertyId: 15, name: 'Alhaja Bilkisu Bello', phone: '08167890123', email: 'bbello@outlook.com', rentAmount: 2600000, lastPaymentDate: '2026-08-01', nextDueDate: '2027-08-01', status: 'Current' },
]

const INITIAL_USERS: User[] = [
  { id: 'usr-admin', name: 'System Admin', email: 'admin@realestate.com', role: 'admin', phone: '08000000001', createdAt: '2026-01-01' },
  { id: 'usr-landlord-1', name: 'Chief Adebayo (Landlord 1)', email: 'landlord1@example.com', role: 'landlord', landlordId: 1, phone: '08012345670', createdAt: '2026-01-10' },
  { id: 'usr-landlord-2', name: 'Alhaji Musa (Landlord 2)', email: 'landlord2@example.com', role: 'landlord', landlordId: 2, phone: '08012345671', createdAt: '2026-01-12' },
  { id: 'usr-landlord-3', name: 'Dr. (Mrs) Okafor (Landlord 3)', email: 'landlord3@example.com', role: 'landlord', landlordId: 3, phone: '08012345672', createdAt: '2026-01-15' },
  { id: 'usr-agent-1', name: 'Sarah Jenkins (Senior Agent)', email: 'agent1@example.com', role: 'agent', agentId: 1, phone: '08098765431', createdAt: '2026-02-01' },
  { id: 'usr-agent-2', name: 'Michael Okon (Field Agent)', email: 'agent2@example.com', role: 'agent', agentId: 2, phone: '08098765432', createdAt: '2026-02-15' },
  { id: 'usr-tenant-1', name: 'Dr. Kunle Balogun', email: 'kunle.balogun@gmail.com', role: 'tenant', phone: '08023456789', createdAt: '2026-03-01' },
]

// Generate rich rent payment records
const INITIAL_RENTS: RentPayment[] = [
  // Landlord 1 properties (1, 2, 3)
  { id: 1, receiptNo: 'REC-1001', propertyId: 1, tenantId: 1, amountPaid: 3500000, debit: 0, credit: 3500000, balance: 0, paymentDate: '2026-09-01T10:30:00Z', paymentMethod: 'Bank Transfer' },
  { id: 2, receiptNo: 'REC-1002', propertyId: 2, tenantId: 2, amountPaid: 7200000, debit: 0, credit: 7200000, balance: 0, paymentDate: '2026-08-15T14:15:00Z', paymentMethod: 'Bank Transfer' },
  { id: 3, receiptNo: 'REC-1003', propertyId: 3, tenantId: 3, amountPaid: 2800000, debit: 0, credit: 2800000, balance: 0, paymentDate: '2025-10-10T11:00:00Z', paymentMethod: 'Cheque' },
  { id: 4, receiptNo: 'REC-1004', propertyId: 1, tenantId: 1, amountPaid: 3500000, debit: 0, credit: 3500000, balance: 0, paymentDate: '2025-09-01T09:20:00Z', paymentMethod: 'Bank Transfer' },

  // Landlord 2 properties (4, 5, 6)
  { id: 5, receiptNo: 'REC-1005', propertyId: 4, tenantId: 4, amountPaid: 6000000, debit: 0, credit: 6000000, balance: 0, paymentDate: '2026-07-01T12:00:00Z', paymentMethod: 'Bank Transfer' },
  { id: 6, receiptNo: 'REC-1006', propertyId: 5, tenantId: 5, amountPaid: 8500000, debit: 0, credit: 8500000, balance: 0, paymentDate: '2026-06-15T16:30:00Z', paymentMethod: 'Bank Transfer' },
  { id: 7, receiptNo: 'REC-1007', propertyId: 6, tenantId: 6, amountPaid: 1200000, debit: 0, credit: 1200000, balance: 0, paymentDate: '2026-01-10T08:45:00Z', paymentMethod: 'Cash' },

  // Landlord 3 properties (7, 8, 9)
  { id: 8, receiptNo: 'REC-1008', propertyId: 7, tenantId: 7, amountPaid: 4200000, debit: 0, credit: 4200000, balance: 0, paymentDate: '2026-09-12T13:00:00Z', paymentMethod: 'Bank Transfer' },
  { id: 9, receiptNo: 'REC-1009', propertyId: 8, tenantId: 8, amountPaid: 6800000, debit: 0, credit: 6800000, balance: 0, paymentDate: '2026-04-01T10:10:00Z', paymentMethod: 'Bank Transfer' },
  { id: 10, receiptNo: 'REC-1010', propertyId: 9, tenantId: 9, amountPaid: 3800000, debit: 0, credit: 3800000, balance: 0, paymentDate: '2026-08-20T11:45:00Z', paymentMethod: 'Bank Transfer' },

  // Landlord 4 properties (10, 11, 12)
  { id: 11, receiptNo: 'REC-1011', propertyId: 10, tenantId: 10, amountPaid: 9500000, debit: 0, credit: 9500000, balance: 0, paymentDate: '2026-05-01T15:20:00Z', paymentMethod: 'Bank Transfer' },
  { id: 12, receiptNo: 'REC-1012', propertyId: 11, tenantId: 11, amountPaid: 11000000, debit: 0, credit: 11000000, balance: 0, paymentDate: '2026-07-15T09:15:00Z', paymentMethod: 'Bank Transfer' },

  // Landlord 5 properties (13, 14, 15)
  { id: 13, receiptNo: 'REC-1013', propertyId: 13, tenantId: 13, amountPaid: 3000000, debit: 0, credit: 3000000, balance: 0, paymentDate: '2026-09-05T14:40:00Z', paymentMethod: 'Bank Transfer' },
  { id: 14, receiptNo: 'REC-1014', propertyId: 14, tenantId: 14, amountPaid: 7800000, debit: 0, credit: 7800000, balance: 0, paymentDate: '2026-06-01T12:30:00Z', paymentMethod: 'Bank Transfer' },
  { id: 15, receiptNo: 'REC-1015', propertyId: 15, tenantId: 15, amountPaid: 2600000, debit: 0, credit: 2600000, balance: 0, paymentDate: '2026-08-01T10:00:00Z', paymentMethod: 'Cheque' },
]

// Initial expenses
const INITIAL_EXPENSES: ExpenseRecord[] = [
  // Landlord 1
  { id: 1, receiptNo: 'EXP-2001', propertyId: 1, description: 'Facility Generator Servicing & Diesel Supply', period: 'Sep 2026', debit: 220000, credit: 0, balance: 0, createdAt: '2026-09-18T10:00:00Z', category: 'Utilities' },
  { id: 2, receiptNo: 'EXP-2002', propertyId: 2, description: 'Elevator Maintenance & Quarterly Inspection', period: 'Aug 2026', debit: 450000, credit: 0, balance: 0, createdAt: '2026-08-20T11:30:00Z', category: 'Maintenance' },
  { id: 3, receiptNo: 'EXP-2003', propertyId: 3, description: 'Water Pipeline & Soakaway Clearing', period: 'Sep 2026', debit: 180000, credit: 0, balance: 0, createdAt: '2026-09-28T09:15:00Z', category: 'Plumbing' },

  // Landlord 2
  { id: 4, receiptNo: 'EXP-2004', propertyId: 4, description: 'Security Guard Monthly Remittance & CCTV Check', period: 'Jul 2026', debit: 300000, credit: 0, balance: 0, createdAt: '2026-07-25T14:00:00Z', category: 'Security' },
  { id: 5, receiptNo: 'EXP-2005', propertyId: 5, description: 'Central AC Duct Cleaning & Filter Replacement', period: 'Jun 2026', debit: 380000, credit: 0, balance: 0, createdAt: '2026-06-22T13:20:00Z', category: 'HVAC' },
  { id: 6, receiptNo: 'EXP-2006', propertyId: 6, description: 'Deep Cleaning & Post-Tenancy Lock Change', period: 'Sep 2026', debit: 95000, credit: 0, balance: 0, createdAt: '2026-09-02T10:10:00Z', category: 'Turnover' },

  // Landlord 3
  { id: 7, receiptNo: 'EXP-2007', propertyId: 7, description: 'Exterior Wall Repainting & Waterproofing', period: 'Aug 2026', debit: 520000, credit: 0, balance: 0, createdAt: '2026-08-14T08:30:00Z', category: 'Painting' },
  { id: 8, receiptNo: 'EXP-2008', propertyId: 8, description: 'Emergency Roof Leakage Repair after Rainstorm', period: 'Sep 2026', debit: 290000, credit: 0, balance: 0, createdAt: '2026-09-15T15:45:00Z', category: 'Structural' },

  // Landlord 4
  { id: 9, receiptNo: 'EXP-2009', propertyId: 10, description: 'Intercom System Rewiring & Inverter Battery Replacement', period: 'May 2026', debit: 350000, credit: 0, balance: 0, createdAt: '2026-05-18T12:00:00Z', category: 'Electrical' },
  { id: 10, receiptNo: 'EXP-2010', propertyId: 11, description: 'Commercial Waste Disposal & Sanitation Compliance', period: 'Jul 2026', debit: 160000, credit: 0, balance: 0, createdAt: '2026-07-10T16:00:00Z', category: 'Sanitation' },

  // Landlord 5
  { id: 11, receiptNo: 'EXP-2011', propertyId: 13, description: 'Compound Landscaping, Tree Trimming & Gardening', period: 'Sep 2026', debit: 110000, credit: 0, balance: 0, createdAt: '2026-09-08T11:00:00Z', category: 'Landscaping' },
  { id: 12, receiptNo: 'EXP-2012', propertyId: 14, description: 'Fire Extinguisher Recertification & Smoke Alarms', period: 'Jun 2026', debit: 240000, credit: 0, balance: 0, createdAt: '2026-06-12T14:30:00Z', category: 'Safety' },
]

// Maintenance & Repairs requests
const INITIAL_MAINTENANCE: MaintenanceRequest[] = [
  {
    id: 1,
    propertyId: 3,
    landlordId: 1,
    agentId: 2,
    requestedByName: 'Michael Okon (Agent)',
    title: 'Master Bathroom Shower Leakage & Tile Crack',
    description: 'Shower pipe leaking through the lower drywall into unit hallway. Needs plumber and replacing cracked floor tiles.',
    category: 'Plumbing',
    priority: 'High',
    status: 'Needs Repair',
    estimatedCost: 185000,
    reportedDate: '2026-10-02T09:30:00Z',
    notes: 'Awaiting landlord approval for plumber deployment.',
  },
  {
    id: 2,
    propertyId: 8,
    landlordId: 3,
    agentId: 2,
    requestedByName: 'Michael Okon (Agent)',
    title: 'Commercial Inverter & Server Room AC Failure',
    description: 'Server room AC tripped the circuit breaker. Office tenant Nexus Cloud requested urgent fix to avoid server overheating.',
    category: 'HVAC',
    priority: 'Emergency',
    status: 'In Progress',
    estimatedCost: 320000,
    reportedDate: '2026-10-08T14:00:00Z',
    notes: 'HVAC technician currently on site. Inverter capacitor replaced, running load tests.',
  },
  {
    id: 3,
    propertyId: 1,
    landlordId: 1,
    agentId: 1,
    requestedByName: 'Sarah Jenkins (Agent)',
    title: 'Automatic Gate Sensor Replacement',
    description: 'Entrance motorized gate sensor unresponsive during power transitions. Requires optical eye sensor swap.',
    category: 'Electrical',
    priority: 'Medium',
    status: 'Repaired',
    estimatedCost: 95000,
    actualCost: 90000,
    reportedDate: '2026-09-20T11:00:00Z',
    repairedDate: '2026-09-24T16:00:00Z',
    notes: 'Completed by FastGate Engineering. Gate tested and functional.',
  },
  {
    id: 4,
    propertyId: 6,
    landlordId: 2,
    agentId: 2,
    requestedByName: 'Michael Okon (Agent)',
    title: 'Turnover Repainting & Key Lock Replacement',
    description: 'Tenant Emeka Nwosu vacated on Aug 31. Unit requires touch-up painting, deep cleaning, and new master cylinder locks.',
    category: 'Painting',
    priority: 'Medium',
    status: 'In Progress',
    estimatedCost: 140000,
    reportedDate: '2026-09-05T10:00:00Z',
    notes: 'Painting completed. New locks scheduled for installation tomorrow.',
  },
  {
    id: 5,
    propertyId: 7,
    landlordId: 3,
    agentId: 1,
    requestedByName: 'Sarah Jenkins (Agent)',
    title: 'Borehole Water Pump Pressure Switch Fault',
    description: 'Low water pressure on upper floors due to faulty pump relay switch. Water tank not refilling automatically.',
    category: 'Plumbing',
    priority: 'High',
    status: 'Repaired',
    estimatedCost: 125000,
    actualCost: 120000,
    reportedDate: '2026-09-10T08:15:00Z',
    repairedDate: '2026-09-12T17:00:00Z',
    notes: 'Replaced Grundfos pressure controller. Full pressure restored.',
  },
  {
    id: 6,
    propertyId: 12,
    landlordId: 4,
    agentId: 1,
    requestedByName: 'Sarah Jenkins (Agent)',
    title: 'Vacated Unit Inspection & Balcony Railing Welding',
    description: 'Previous tenants vacated in Sep. Loose balcony railing on 2nd floor balcony poses safety hazard.',
    category: 'Structural',
    priority: 'High',
    status: 'Needs Repair',
    estimatedCost: 110000,
    reportedDate: '2026-10-01T15:30:00Z',
    notes: 'Fabricator inspected. Quotation received, awaiting authorization.',
  },
]

// In-Memory state store (singleton)
class Store {
  users: User[] = [...INITIAL_USERS]
  landlords: Landlord[] = [...INITIAL_LANDLORDS]
  properties: Property[] = [...INITIAL_PROPERTIES]
  tenants: Tenant[] = [...INITIAL_TENANTS]
  rents: RentPayment[] = [...INITIAL_RENTS]
  expenses: ExpenseRecord[] = [...INITIAL_EXPENSES]
  maintenance: MaintenanceRequest[] = [...INITIAL_MAINTENANCE]

  // USERS
  getUsers() {
    return this.users
  }

  addUser(user: Omit<User, 'id' | 'createdAt'>) {
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    }
    this.users.unshift(newUser)
    return newUser
  }

  // LANDLORDS
  getLandlords() {
    return this.landlords.map(l => {
      const props = this.properties.filter(p => p.landlordId === l.id)
      return {
        ...l,
        _count: {
          properties: props.length,
        },
      }
    })
  }

  getLandlordById(id: number) {
    const l = this.landlords.find(item => item.id === id)
    if (!l) return null

    const properties = this.properties.filter(p => p.landlordId === l.id).map(p => {
      const propTenants = this.tenants.filter(t => t.propertyId === p.id)
      return {
        ...p,
        tenants: propTenants,
      }
    })

    const propIds = properties.map(p => p.id)
    const rents = this.rents.filter(r => propIds.includes(r.propertyId))
    const expenses = this.expenses.filter(e => propIds.includes(e.propertyId))

    const totalRentCollected = rents.reduce((sum, r) => sum + (r.credit || r.amountPaid || 0), 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.debit || 0), 0)

    return {
      ...l,
      properties,
      totalRentCollected,
      totalExpenses,
      netBalance: totalRentCollected - totalExpenses,
    }
  }

  // PROPERTIES
  getProperties(filter?: { landlordId?: number; agentId?: number; status?: string; search?: string }) {
    let result = this.properties.map(p => {
      const landlord = this.landlords.find(l => l.id === p.landlordId)
      const agentUser = this.users.find(u => u.agentId === p.assignedAgentId)
      const propTenants = this.tenants.filter(t => t.propertyId === p.id)
      const propRents = this.rents.filter(r => r.propertyId === p.id)
      const propExpenses = this.expenses.filter(e => e.propertyId === p.id)
      const propRepairs = this.maintenance.filter(m => m.propertyId === p.id)

      const totalRent = propRents.reduce((s, r) => s + (r.credit || r.amountPaid || 0), 0)
      const totalExp = propExpenses.reduce((s, e) => s + (e.debit || 0), 0)

      return {
        ...p,
        landlord: landlord ? { id: landlord.id, name: landlord.name, email: landlord.email, phone: landlord.phone } : undefined,
        assignedAgent: agentUser ? { id: agentUser.agentId, name: agentUser.name, email: agentUser.email } : undefined,
        _count: {
          tenants: propTenants.filter(t => t.status !== 'Vacated').length,
          totalTenants: propTenants.length,
          repairs: propRepairs.filter(m => m.status !== 'Repaired').length,
        },
        financials: {
          totalRent,
          totalExpenses: totalExp,
          netProfit: totalRent - totalExp,
        },
      }
    })

    if (filter?.landlordId) {
      result = result.filter(p => p.landlordId === filter.landlordId)
    }
    if (filter?.agentId) {
      result = result.filter(p => p.assignedAgentId === filter.agentId)
    }
    if (filter?.status && filter.status !== 'All') {
      result = result.filter(p => p.status.toLowerCase() === filter.status!.toLowerCase())
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      )
    }

    return result
  }

  // TENANTS
  getTenants(filter?: { propertyId?: number; agentId?: number; status?: string; search?: string }) {
    let result = this.tenants.map(t => {
      const property = this.properties.find(p => p.id === t.propertyId)
      const landlord = property ? this.landlords.find(l => l.id === property.landlordId) : undefined
      const agentUser = property ? this.users.find(u => u.agentId === property.assignedAgentId) : undefined

      return {
        ...t,
        property: property ? {
          id: property.id,
          name: property.name,
          address: property.address,
          city: property.city,
          assignedAgentId: property.assignedAgentId,
          landlordId: property.landlordId,
          landlordName: landlord?.name,
          agentName: agentUser?.name,
        } : undefined,
      }
    })

    if (filter?.propertyId) {
      result = result.filter(t => t.propertyId === filter.propertyId)
    }
    if (filter?.agentId) {
      result = result.filter(t => t.property?.assignedAgentId === filter.agentId)
    }
    if (filter?.status && filter.status !== 'All') {
      result = result.filter(t => t.status.toLowerCase() === filter.status!.toLowerCase())
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.property && t.property.address.toLowerCase().includes(q))
      )
    }

    return result
  }

  updateTenantStatus(tenantId: number, status: 'Current' | 'Overdue' | 'Vacated', notes?: string, vacatedDate?: string) {
    const tenant = this.tenants.find(t => t.id === tenantId)
    if (!tenant) return null

    tenant.status = status
    if (notes) tenant.notes = notes
    if (status === 'Vacated') {
      tenant.vacatedDate = vacatedDate || new Date().toISOString().split('T')[0]
      // Mark property status to Vacant if no other active tenants
      const prop = this.properties.find(p => p.id === tenant.propertyId)
      if (prop) {
        const otherActive = this.tenants.filter(t => t.propertyId === prop.id && t.id !== tenantId && t.status !== 'Vacated')
        if (otherActive.length === 0) {
          prop.status = 'Vacant'
        }
      }
    } else if (status === 'Current') {
      const prop = this.properties.find(p => p.id === tenant.propertyId)
      if (prop && prop.status === 'Vacant') {
        prop.status = 'Active'
      }
    }
    return tenant
  }

  // RENTS
  getRents(filter?: { landlordId?: number; propertyId?: number; search?: string }) {
    let result = this.rents.map(r => {
      const property = this.properties.find(p => p.id === r.propertyId)
      const tenant = this.tenants.find(t => t.id === r.tenantId)
      const landlord = property ? this.landlords.find(l => l.id === property.landlordId) : undefined

      return {
        ...r,
        property: property ? {
          id: property.id,
          name: property.name,
          address: property.address,
          landlordId: property.landlordId,
          landlordName: landlord?.name,
        } : undefined,
        tenant: tenant ? {
          id: tenant.id,
          name: tenant.name,
        } : undefined,
      }
    })

    if (filter?.landlordId) {
      result = result.filter(r => r.property?.landlordId === filter.landlordId)
    }
    if (filter?.propertyId) {
      result = result.filter(r => r.propertyId === filter.propertyId)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      result = result.filter(r =>
        r.receiptNo.toLowerCase().includes(q) ||
        (r.tenant && r.tenant.name.toLowerCase().includes(q)) ||
        (r.property && r.property.address.toLowerCase().includes(q)) ||
        (r.property && r.property.name.toLowerCase().includes(q))
      )
    }

    return result
  }

  // EXPENSES
  getExpenses(filter?: { landlordId?: number; propertyId?: number; search?: string }) {
    let result = this.expenses.map(e => {
      const property = this.properties.find(p => p.id === e.propertyId)
      const landlord = property ? this.landlords.find(l => l.id === property.landlordId) : undefined

      return {
        ...e,
        property: property ? {
          id: property.id,
          name: property.name,
          address: property.address,
          landlordId: property.landlordId,
          landlordName: landlord?.name,
        } : undefined,
      }
    })

    if (filter?.landlordId) {
      result = result.filter(e => e.property?.landlordId === filter.landlordId)
    }
    if (filter?.propertyId) {
      result = result.filter(e => e.propertyId === filter.propertyId)
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      result = result.filter(e =>
        e.receiptNo.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.period.toLowerCase().includes(q) ||
        (e.property && e.property.address.toLowerCase().includes(q))
      )
    }

    return result
  }

  // MAINTENANCE & REPAIRS
  getMaintenance(filter?: { landlordId?: number; agentId?: number; propertyId?: number; status?: string; search?: string }) {
    let result = this.maintenance.map(m => {
      const property = this.properties.find(p => p.id === m.propertyId)
      const landlord = this.landlords.find(l => l.id === m.landlordId)
      const agentUser = this.users.find(u => u.agentId === m.agentId)

      return {
        ...m,
        property: property ? {
          id: property.id,
          name: property.name,
          address: property.address,
          city: property.city,
        } : undefined,
        landlord: landlord ? {
          id: landlord.id,
          name: landlord.name,
        } : undefined,
        agent: agentUser ? {
          id: agentUser.agentId,
          name: agentUser.name,
        } : undefined,
      }
    })

    if (filter?.landlordId) {
      result = result.filter(m => m.landlordId === filter.landlordId)
    }
    if (filter?.agentId) {
      result = result.filter(m => m.agentId === filter.agentId)
    }
    if (filter?.propertyId) {
      result = result.filter(m => m.propertyId === filter.propertyId)
    }
    if (filter?.status && filter.status !== 'All') {
      result = result.filter(m => m.status.toLowerCase() === filter.status!.toLowerCase())
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase()
      result = result.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.property && m.property.name.toLowerCase().includes(q))
      )
    }

    return result
  }

  addMaintenanceRequest(req: {
    propertyId: number
    agentId: number
    requestedByName: string
    title: string
    description: string
    category: MaintenanceRequest['category']
    priority: MaintenanceRequest['priority']
    estimatedCost: number
  }) {
    const prop = this.properties.find(p => p.id === req.propertyId)
    const newReq: MaintenanceRequest = {
      id: this.maintenance.length + 1,
      propertyId: req.propertyId,
      landlordId: prop?.landlordId || 1,
      agentId: req.agentId,
      requestedByName: req.requestedByName,
      title: req.title,
      description: req.description,
      category: req.category,
      priority: req.priority,
      status: 'Needs Repair',
      estimatedCost: req.estimatedCost,
      reportedDate: new Date().toISOString(),
    }
    this.maintenance.unshift(newReq)

    // Update property status to 'Needs Repair' if active
    if (prop && prop.status === 'Active') {
      prop.status = 'Needs Repair'
    }

    return newReq
  }

  updateMaintenanceStatus(id: number, status: 'Needs Repair' | 'In Progress' | 'Repaired', actualCost?: number, notes?: string) {
    const item = this.maintenance.find(m => m.id === id)
    if (!item) return null

    item.status = status
    if (actualCost !== undefined) item.actualCost = actualCost
    if (notes) item.notes = notes
    if (status === 'Repaired') {
      item.repairedDate = new Date().toISOString()
      // Check if property has any other unresolved repairs
      const prop = this.properties.find(p => p.id === item.propertyId)
      if (prop && prop.status === 'Needs Repair') {
        const otherPending = this.maintenance.filter(m => m.propertyId === prop.id && m.id !== id && m.status !== 'Repaired')
        if (otherPending.length === 0) {
          prop.status = 'Active'
        }
      }
    }
    return item
  }

  // LANDLORD AGGREGATE STATS
  getLandlordDashboardData(landlordId: number) {
    const landlord = this.landlords.find(l => l.id === landlordId)
    if (!landlord) return null

    const properties = this.getProperties({ landlordId })
    const propIds = properties.map(p => p.id)

    const rents = this.getRents({ landlordId })
    const expenses = this.getExpenses({ landlordId })
    const repairs = this.getMaintenance({ landlordId })

    const totalRevenueCombined = rents.reduce((sum, r) => sum + (r.credit || r.amountPaid || 0), 0)
    const totalExpensesCombined = expenses.reduce((sum, e) => sum + (e.debit || 0), 0)
    const netRevenueCombined = totalRevenueCombined - totalExpensesCombined

    // Revenue per property breakdown
    const propertyBreakdown = properties.map(p => {
      const pRents = rents.filter(r => r.propertyId === p.id)
      const pExpenses = expenses.filter(e => e.propertyId === p.id)
      const pRepairs = repairs.filter(m => m.propertyId === p.id)

      const revenue = pRents.reduce((s, r) => s + (r.credit || r.amountPaid || 0), 0)
      const expense = pExpenses.reduce((s, e) => s + (e.debit || 0), 0)
      const net = revenue - expense
      const percentOfTotal = totalRevenueCombined > 0 ? ((revenue / totalRevenueCombined) * 100).toFixed(1) : '0'

      return {
        propertyId: p.id,
        propertyName: p.name,
        address: p.address,
        city: p.city,
        type: p.type,
        status: p.status,
        tenantsCount: p._count.tenants,
        pendingRepairsCount: pRepairs.filter(m => m.status !== 'Repaired').length,
        revenue,
        expense,
        net,
        percentOfTotal,
      }
    })

    const pendingRepairs = repairs.filter(r => r.status === 'Needs Repair')
    const inProgressRepairs = repairs.filter(r => r.status === 'In Progress')
    const completedRepairs = repairs.filter(r => r.status === 'Repaired')

    return {
      landlord,
      combined: {
        totalRevenue: totalRevenueCombined,
        totalExpenses: totalExpensesCombined,
        netRevenue: netRevenueCombined,
        totalProperties: properties.length,
        totalRepairsCount: repairs.length,
        needsRepairCount: pendingRepairs.length,
        inProgressCount: inProgressRepairs.length,
        repairedCount: completedRepairs.length,
      },
      propertyBreakdown,
      repairs,
      rents,
      expenses,
    }
  }

  // AGENT AGGREGATE STATS
  getAgentDashboardData(agentId: number) {
    const agentUser = this.users.find(u => u.agentId === agentId)
    const assignedProperties = this.getProperties({ agentId })
    const assignedPropIds = assignedProperties.map(p => p.id)

    const tenants = this.getTenants({ agentId })
    const activeTenants = tenants.filter(t => t.status === 'Current')
    const overdueTenants = tenants.filter(t => t.status === 'Overdue')
    const vacatedTenants = tenants.filter(t => t.status === 'Vacated')

    const maintenance = this.getMaintenance({ agentId })
    const pendingRepairs = maintenance.filter(m => m.status === 'Needs Repair')
    const inProgressRepairs = maintenance.filter(m => m.status === 'In Progress')
    const completedRepairs = maintenance.filter(m => m.status === 'Repaired')

    const vacantProperties = assignedProperties.filter(p => p.status === 'Vacant')

    return {
      agent: agentUser || { name: 'Assigned Agent', agentId },
      stats: {
        assignedPropertiesCount: assignedProperties.length,
        totalTenantsCount: tenants.length,
        activeTenantsCount: activeTenants.length,
        overdueTenantsCount: overdueTenants.length,
        vacatedTenantsCount: vacatedTenants.length,
        vacantPropertiesCount: vacantProperties.length,
        totalRepairsCount: maintenance.length,
        pendingRepairsCount: pendingRepairs.length,
        inProgressRepairsCount: inProgressRepairs.length,
        completedRepairsCount: completedRepairs.length,
      },
      assignedProperties,
      tenants,
      maintenance,
    }
  }
}

// Global singleton instance
const globalForStore = globalThis as unknown as { store: Store | undefined }
export const dataStore = globalForStore.store ?? new Store()
if (process.env.NODE_ENV !== 'production') {
  globalForStore.store = dataStore
}
