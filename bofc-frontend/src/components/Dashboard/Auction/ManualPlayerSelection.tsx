import React, { useState, useEffect } from 'react';
import { Button, Select, message } from 'antd';
import axios from 'axios';

const { Option } = Select;

interface Player {
    id: number;
    name: string;
}

interface ManualPlayerSelectionProps {
    tournamentId: number;
    onPlayerSelected: () => void;
}

const ManualPlayerSelection: React.FC<ManualPlayerSelectionProps> = ({ tournamentId, onPlayerSelected }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch available and unsold players
        const fetchPlayers = async () => {
            try {
                const response = await axios.get(`/api/tournaments/${tournamentId}/players/available-unsold`);
                console.log('Fetched players:', response.data); // Debugging log
                setPlayers(response.data);
            } catch (error) {
                console.error('Error fetching players:', error); // Debugging log
                message.error('Failed to fetch players.');
            }
        };

        fetchPlayers();
    }, [tournamentId]);

    const handlePlayerSelect = (value: number) => {
        console.log('Selected Player ID:', value); // Debugging log
        setSelectedPlayer(value);
    };

    const handleSubmit = async () => {
        if (!selectedPlayer) {
            message.warning('Please select a player.');
            return;
        }

        setLoading(true);
        try {
            console.log('Submitting player for auction:', selectedPlayer); // Debugging log
            await axios.post(`/api/tournaments/${tournamentId}/auction/select-player`, { playerId: selectedPlayer });
            message.success('Player successfully selected for auction.');
            onPlayerSelected();
        } catch (error) {
            console.error('Error submitting player for auction:', error); // Debugging log
            message.error('Failed to select player for auction.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3>Debugging Logs</h3>
            <pre>{JSON.stringify(players, null, 2)}</pre> {/* Display fetched players */}

            <Select
                style={{ width: '100%' }}
                placeholder="Select a player"
                onChange={(value) => {
                    console.log('Dropdown value changed:', value); // Debugging log
                    console.log('Players state:', players); // Debugging log
                    handlePlayerSelect(value);
                }}
                value={selectedPlayer}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) => {
                    console.log('Filter input:', input); // Debugging log
                    console.log('Filter option:', option); // Debugging log
                    if (option?.children) {
                        return option.children.toString().toLowerCase().includes(input.toLowerCase());
                    }
                    return false;
                }}
            >
                {players.map((player) => (
                    <Option key={player.id} value={player.id}>
                        {player.name}
                    </Option>
                ))}
            </Select>
            <Button
                type="primary"
                onClick={handleSubmit}
                loading={loading}
                style={{ marginTop: '10px' }}
            >
                Select Player
            </Button>
        </div>
    );
};

export default ManualPlayerSelection;