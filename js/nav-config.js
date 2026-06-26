/** Shared navigation + site metadata — single source for sidebar and breadcrumbs */
const SITE_NAV = [
    {
        label: 'Home',
        items: [{ href: 'index.html', label: 'Home', id: 'index' }]
    },
    {
        label: 'Documents',
        items: [
            { href: 'contract.html', label: 'Contract (2022–26)', id: 'contract' },
            { href: 'scans.html', label: 'Scanned Pages', id: 'scans' },
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
    'index.html': 'index',
    'contract.html': 'contract',
    'scans.html': 'scans',
    'tool-program.html': 'tool-program',
    'stewards.html': 'stewards',
    'employees.html': 'employees',
    'suggestions.html': 'suggestions'
};
