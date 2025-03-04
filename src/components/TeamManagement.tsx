// src/components/TeamManagement.tsx

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Users, Coins, PlusCircle, Settings, TrendingUp, DollarSign 
} from 'lucide-react';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [showNewPool, setShowNewPool] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fractional Funding Teams</h1>
        <Button onClick={() => setShowNewTeam(true)}>
          <PlusCircle className="w-4 h-4 mr-2" />
          Create Team
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-64">
          <p>Loading teams...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.length > 0 ? (
            teams.map(team => (
              <TeamCard 
                key={team.id} 
                team={team}
                onCreatePool={() => {
                  setSelectedTeam(team);
                  setShowNewPool(true);
                }}
              />
            ))
          ) : (
            <div className="col-span-3 text-center p-8">
              <p className="text-gray-500">No teams found. Create your first team to get started.</p>
            </div>
          )}
        </div>
      )}

      <NewTeamDialog
        open={showNewTeam}
        onClose={() => setShowNewTeam(false)}
        onSubmit={fetchTeams}
      />

      <NewPoolDialog
        open={showNewPool}
        team={selectedTeam}
        onClose={() => {
          setShowNewPool(false);
          setSelectedTeam(null);
        }}
        onSubmit={fetchTeams}
      />
    </div>
  );
};

const TeamCard = ({ team, onCreatePool }) => {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{team.name}</h3>
          <p className="text-sm text-gray-500">Led by {team.leader.name}</p>
        </div>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <span className="text-sm font-medium">{team.members.length} Members</span>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <Coins className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
          <span className="text-sm font-medium">{team.activePools} Active Pools</span>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Total Invested</p>
          <p className="font-semibold">
            ${team.totalInvested.toLocaleString()}
          </p>
        </div>
        <Button onClick={onCreatePool}>Create Pool</Button>
      </div>
    </Card>
  );
};

const NewTeamDialog = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    members: ['']
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to create team');
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Team</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                name: e.target.value
              }))}
              placeholder="Enter team name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Initial Members</label>
            {formData.members.map((member, index) => (
              <div key={index} className="flex space-x-2 mb-2">
                <Input
                  value={member}
                  onChange={(e) => {
                    const newMembers = [...formData.members];
                    newMembers[index] = e.target.value;
                    setFormData(prev => ({ ...prev, members: newMembers }));
                  }}
                  placeholder="Enter member email"
                />
                {index > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newMembers = formData.members.filter((_, i) => i !== index);
                      setFormData(prev => ({ ...prev, members: newMembers }));
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  members: [...prev.members, '']
                }));
              }}
            >
              Add Member
            </Button>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Team
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};

const NewPoolDialog = ({ open, team, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    targetAmount: '',
    minContribution: '',
    maxContribution: '',
    deadline: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/teams/${team.id}/pools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          targetAmount: Number(formData.targetAmount),
          minContribution: Number(formData.minContribution),
          maxContribution: Number(formData.maxContribution)
        })
      });
      
      if (!response.ok) throw new Error('Failed to create pool');
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create Funding Pool</h2>
        {team && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Target Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <Input
                  type="number"
                  className="pl-8"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    targetAmount: e.target.value
                  }))}
                  placeholder="Enter target amount"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Min Contribution
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <Input
                    type="number"
                    className="pl-8"
                    value={formData.minContribution}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      minContribution: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Max Contribution
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <Input
                    type="number"
                    className="pl-8"
                    value={formData.maxContribution}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      maxContribution: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Deadline
              </label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  deadline: e.target.value
                }))}
              />
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Create Pool
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
};

export default TeamManagement;