import ManualPlayerSelection from './Auction/ManualPlayerSelection';

const Dashboard = () => {
    const currentMatchDayId: number = parseInt(
        localStorage.getItem('currentMatchDayId') || localStorage.getItem('currentTournamentId') || '0',
        10,
    );

    const handlePlayerSelected = () => {
        console.log('Player selected for auction. Refreshing data...');
    };

    return (
        <div>
            {/* ...existing code... */}

            <h2>Manual Player Selection</h2>
            <ManualPlayerSelection 
                matchDayId={currentMatchDayId} 
                onPlayerSelected={handlePlayerSelected} 
            />

            {/* ...existing code... */}
        </div>
    );
};

export default Dashboard;