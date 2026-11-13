import React from 'react';
import ShopRegistration from './components/ShopRegistration';
import AdminVerification from './components/AdminVerification';

function App() {
  return (
    <div className="App" style={{ padding: '20px' }}>
      <h1>PetCare BD - Feature 19</h1>
      <ShopRegistration />
      <hr />
      <AdminVerification />
    </div>
  );
}

export default App;