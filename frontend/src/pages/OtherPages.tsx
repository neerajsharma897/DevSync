import React from 'react';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-8 flex items-center justify-center h-full">
    <div className="glass-card p-12 text-center animate-fadeIn">
      <h1 className="text-4xl font-bold gradient-text mb-4">{title}</h1>
      <p className="text-text-secondary">This section is currently under development.</p>
    </div>
  </div>
);

export const ProfilePage = () => <PlaceholderPage title="Profile" />;
export const AdminPage = () => <PlaceholderPage title="Admin" />;
export const NotFoundPage = () => <PlaceholderPage title="404 - Not Found" />;
