const contractData = {
    title: "AGREEMENT",
    parties: "This Agreement entered into this First day of July 1, 2022 between U.S. Facilities, Inc., hereinafter referred to as the \"Employer\", and the International Union of Operating Engineers, Local 835, AFL-CIO, hereinafter referred to as the \"Union\", hereby agree to be bound by the terms and conditions set forth hereinafter and further agree that this Agreement shall be binding upon both the Employer and the Union.",
    effectiveDate: "Effective July 1, 2022",
    articles: [
        {
            id: "article-1",
            title: "ARTICLE I. RECOGNITION",
            content: `Section 1. The Employer hereby recognizes the Union as the exclusive bargaining agent for full time covered employees at the Curran-Fromhold Correctional Facility, and Riverside Correctional Facility Philadelphia, PA with respect to wages, hours, and other terms and conditions of employment described in this Agreement.

Section 2. All full time employees in the following classifications are covered under this agreement:
(1) Data Entry Clerk
(2) Secretary
(3) Supply Clerk
(4) Carpenter/Locksmith
(5) Electrician
(6) Electronic Locksmith
(7) Maintenance Mechanic
(8) Stationary Engineer
(9) Maintenance Trades Helper
(10) Laborer
(11) Building Engineer
(12) Supervisor Mechanic, Kitchen Equipment
(13) Maintenance Mechanic, Kitchen Equipment
(14) Maintenance Trades Laborer, Kitchen Equipment
(15) Painter
(16) Plumber

* Maintenance Trades Helper shall principally be aligned with a particular trade category (electrical, plumbing, maintenance mechanic).

Section 3. The Maintenance Trades Helper shall bid into a skill trade category with no change in pay.

Section 4. It is understood that a Maintenance Trade Helper will work primarily in the particular trade category with which he or she is aligned. However, Maintenance Trades Helpers may be assigned to assist other trades as needed.`
        },
        {
            id: "article-2",
            title: "ARTICLE II. UNION SECURITY",
            content: "[Page 1 ends here. Further content pending next page.]"
        }
    ]
};

const employeesData = [
    { name: "ryan", location: "RCF" },
    { name: "nate", location: "RCF" },
    { name: "justin", location: "RCF" },
    { name: "jim", location: "RCF" },
    { name: "monica", location: "RCF" },
    { name: "bill", location: "RCF" },
    { name: "trevor", location: "CFCF" }
];

const shopStewards = [
    { 
        name: "Trevor", 
        role: "Lead Shop Steward", 
        location: "CFCF", 
        image: "trevor.jpg",
        tagline: "#TREVOR4EVER - Ready to fight for your rights!"
    },
    { 
        name: "Justin", 
        role: "Shop Steward", 
        location: "RCF", 
        image: "justin.jpg",
        tagline: "JUSTIN BE BUSSIN - Real Work. Real Respect. Real Results."
    }
];

const contractImages = [
    { url: "page_1.jpg", caption: "Page 1: Agreement & Article I (Recognition)" }
];
