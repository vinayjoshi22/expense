
// Inject mock balance
const balances = [
    {
        id: 'test-1',
        source: 'Test Bank',
        month: '01',
        year: '2025',
        openingBalance: 5000,
        closingBalance: 4500
    },
    {
        id: 'test-2',
        source: 'Test Bank',
        month: '02',
        year: '2025',
        openingBalance: 4500,
        closingBalance: 3000
    }
];
localStorage.setItem('EA_BALANCES_V1', JSON.stringify(balances));

// Also need sources selected to view it
localStorage.setItem('EA_SOURCE_FILTER', JSON.stringify(['Test Bank']));
window.location.reload();
