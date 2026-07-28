/** Shared navigation + site metadata — single source for sidebar and breadcrumbs */
const SITE_NAV = [
    {
        label: 'Home',
        items: [{ href: 'home.html', label: 'Home', id: 'home' }]
    },
    {
        label: 'Member tools',
        items: [
            { href: 'member-action.html', label: 'Action Center', id: 'member-action' },
            { href: 'evidence-log.html', label: 'Evidence log', id: 'evidence-log' },
            { href: 'bargaining.html', label: 'Bargaining tools', id: 'bargaining' }
        ]
    },
    {
        label: 'Documents',
        items: [
            { href: 'contract.html', label: 'Contract (2022–26)', id: 'contract' },
            { href: 'scans.html', label: 'Scanned Pages', id: 'scans' },
            { href: 'member-documents.html', label: 'Member Documents', id: 'member-documents' },
            {
                disabled: true,
                label: '2018–2022',
                title: '2018–2022 CBA — coming later',
                soon: true
            },
            { href: 'tool-program.html', label: 'Tool Program', id: 'tool-program' }
        ]
    },
    {
        label: 'People',
        items: [
            { href: 'stewards.html', label: 'Shop Stewards', id: 'stewards' },
            { href: 'employees.html', label: 'Site Roster', id: 'employees' }
        ]
    },
    {
        label: 'Feedback',
        items: [{ href: 'suggestions.html', label: 'Suggestions', id: 'suggestions' }]
    }
];

const SITE_PAGE_IDS = {
    'home.html': 'home',
    'member-action.html': 'member-action',
    'evidence-log.html': 'evidence-log',
    'bargaining.html': 'bargaining',
    'contract.html': 'contract',
    'scans.html': 'scans',
    'member-documents.html': 'member-documents',
    'tool-program.html': 'tool-program',
    'stewards.html': 'stewards',
    'employees.html': 'employees',
    'suggestions.html': 'suggestions'
};
