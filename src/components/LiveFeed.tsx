import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

type Activity = {
  id: string;
  message: string;
  timestamp: { seconds: number; nanoseconds: number };
};

const LiveFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newActivities = snapshot.docs.map((doc) => ({
        id: doc.id,
        message: doc.data().message || '',
        timestamp: doc.data().timestamp || { seconds: 0, nanoseconds: 0 },
      }));
      setActivities(newActivities);
    });

    return () => unsubscribe();
  }, []);

  const filteredActivities = activities.filter((activity) =>
    filter === 'all' || activity.type === filter
  );

  return (
    <div className="p-4 bg-gray-100 rounded-md">
      <h2 className="text-lg font-bold mb-4">Live Feed</h2>
      <div className="mb-4">
        <button onClick={() => setFilter('all')} className="px-4 py-2 bg-gray-200 rounded-md mr-2">All</button>
        <button onClick={() => setFilter('updates')} className="px-4 py-2 bg-gray-200 rounded-md">Updates</button>
      </div>
      <ul>
        {filteredActivities.map((activity) => (
          <li key={activity.id} className="mb-2">
            <span className="text-sm text-gray-600">{new Date(activity.timestamp.seconds * 1000).toLocaleString()}</span>
            <p>{activity.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LiveFeed;