import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase'; // Ensure correct firebase configuration
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Messaging from '../components/Messaging';

const Home = () => {
  const [userData, setUserData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [userTeams, setUserTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(null);
  const navigate = useNavigate();

  // Fetch the logged-in user's data and update state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserData({ id: user.uid, ...docSnap.data() });
          fetchTeams(user.uid); // Fetch teams after setting user data
        } else {
          console.log('No such document!');
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsersList(usersList);
    };

    fetchUsers();
  }, []);

  // Fetch teams for the logged-in user
  const fetchTeams = async (userId) => {
    const teamsCollection = collection(db, 'teams');
    const teamsSnapshot = await getDocs(teamsCollection);
    const teamsList = teamsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Filter teams based on user membership or teams created by the user
    const userTeamsList = teamsList.filter((team) => 
      team.members.includes(userId) || team.createdBy === userId
    );
    setUserTeams(userTeamsList);
  };

  // Handle user sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      alert(error.message);
    }
  };

  // Toggle user selection for creating a team
  const toggleUserSelection = (userId) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  // Create a new team
  const createTeam = async () => {
    if (teamName && selectedUsers.length > 0 && userData) {
      try {
        const teamId = Date.now().toString();
        const teamData = {
          name: teamName,
          members: [...selectedUsers, userData.id], // Include the creator
          createdBy: userData.id,
        };

        await setDoc(doc(db, 'teams', teamId), teamData);
        alert('Team created successfully!');
        setTeamName('');
        setSelectedUsers([]);
        fetchTeams(userData.id); // Refresh the teams after creation
      } catch (error) {
        console.error('Error creating team:', error);
        alert(error.message);
      }
    } else {
      alert('Please enter a team name and select at least one user.');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Welcome to Your Dashboard</h2>
      {userData ? (
        <div>
          <h4>User Details:</h4>
          <ul className="list-group mb-4">
            <li className="list-group-item">Name: {userData.name}</li>
            <li className="list-group-item">Email: {userData.email}</li>
            <li className="list-group-item">Phone: {userData.phone}</li>
          </ul>
          <button className="btn btn-danger" onClick={handleSignOut}>Sign Out</button>
        </div>
      ) : (
        <h4>Please sign in to see your details.</h4>
      )}

      <h4 className="mt-5">All Users:</h4>
      <div className="row mb-4">
        {usersList.map((user) => (
          <div key={user.id} className="col-md-4 mb-3">
            <div 
              className={`card ${selectedUsers.includes(user.id) ? 'border-primary' : ''}`} 
              onClick={() => toggleUserSelection(user.id)}
              style={{ cursor: 'pointer' }} 
            >
              <div className="card-body">
                <h5 className="card-title">{user.name}</h5>
                <p className="card-text">Email: {user.email}</p>
                <p className="card-text">Phone: {user.phone}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h4>Create a Team:</h4>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Team Name"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" onClick={createTeam}>Create Team</button>

      <h4 className="mt-5">Your Teams:</h4>
      <div className="row mb-4">
        {userTeams.length > 0 ? (
          userTeams.map((team) => (
            <div key={team.id} className="col-md-4 mb-3">
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{team.name}</h5>
                  <p className="card-text">
                    Members: {team.members.map(memberId => {
                      const member = usersList.find(user => user.id === memberId);
                      return member ? member.name : memberId; 
                    }).join(', ')}
                  </p>
                  <button className="btn btn-info" onClick={() => setActiveTeamId(team.id)}>Message Team</button>
                  <p className="card-text">
                    <small>Created By: {usersList.find(user => user.id === team.createdBy)?.name}</small>
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>You are not a member of any teams yet.</p>
        )}
      </div>

      {activeTeamId && (
        <Messaging teamId={activeTeamId} currentUserId={userData.id} />
      )}
    </div>
  );
};

export default Home;
