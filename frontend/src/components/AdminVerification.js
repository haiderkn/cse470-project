import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AdminVerification() {
    const [shops, setShops] = useState([]);

    const fetchPendingShops = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/shops/pending');
            setShops(response.data);
        } catch (error) {
            console.error("Error fetching shops", error);
        }
    };

    useEffect(() => {
        fetchPendingShops();
    }, []);

    const handleVerify = async (id, status) => {
        try {
            await axios.put(`http://localhost:8000/api/shops/${id}/verify`, { status: status });
            alert(`Shop ${status} successfully!`);
            fetchPendingShops(); // Refresh list
        } catch (error) {
            alert("Error updating status");
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', maxWidth: '600px' }}>
            <h2>Admin Dashboard: Pending Verifications</h2>
            <button onClick={fetchPendingShops} style={{marginBottom: '10px'}}>Refresh List</button>
            <ul style={{listStyleType: 'none', padding: 0}}>
                {shops.map(shop => (
                    <li key={shop.id} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <strong>{shop.shop_name}</strong> (Owner: {shop.owner_name})<br/>
                        <em>{shop.address}</em><br/>
                        <button onClick={() => handleVerify(shop.id, 'verified')} style={{ color: 'green', marginRight: '10px', marginTop: '5px' }}>Approve</button>
                        <button onClick={() => handleVerify(shop.id, 'rejected')} style={{ color: 'red', marginTop: '5px' }}>Reject</button>
                    </li>
                ))}
                {shops.length === 0 && <p>No pending shops to verify.</p>}
            </ul>
        </div>
    );
}

export default AdminVerification;