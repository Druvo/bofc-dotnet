import ManualPlayerSelection from './Auction/ManualPlayerSelection';

const Dashboard = () => {
    const currentTournamentId: number = parseInt(localStorage.getItem('currentTournamentId') || '0', 10);

    const handlePlayerSelected = () => {
        console.log('Player selected for auction. Refreshing data...');
    };

    return (
        <div>
            {/* ...existing code... */}

            <h2>Manual Player Selection</h2>
            <ManualPlayerSelection 
                tournamentId={currentTournamentId} 
                onPlayerSelected={handlePlayerSelected} 
            />

            {/* ...existing code... */}
        </div>
    );
};

export default Dashboard;