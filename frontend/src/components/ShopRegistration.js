import React, { useState } from 'react';
import axios from 'axios';

function ShopRegistration() {
    const [formData, setFormData] = useState({
        shop_name: '',
        owner_name: '',
        contact_number: '',
        address: ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Connects to your FastAPI backend
            const response = await axios.post('http://localhost:8000/api/shops/register', formData);
            setMessage(`Success! Shop registered with ID: ${response.data.id}. Status: ${response.data.status}`);
            // Clear form
            setFormData({ shop_name: '', owner_name: '', contact_number: '', address: '' }); 
        } catch (error) {
            setMessage('Error registering shop. Please try again.');
            console.error(error);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px', maxWidth: '500px' }}>
            <h2>Shop Owner Registration</h2>
            <form onSubmit={handleSubmit}>
                <div style={{marginBottom: '10px'}}><label>Shop Name:</label><br/><input name="shop_name" value={formData.shop_name} onChange={handleChange} required /></div>
                <div style={{marginBottom: '10px'}}><label>Owner Name:</label><br/><input name="owner_name" value={formData.owner_name} onChange={handleChange} required /></div>
                <div style={{marginBottom: '10px'}}><label>Contact:</label><br/><input name="contact_number" value={formData.contact_number} onChange={handleChange} required /></div>
                <div style={{marginBottom: '10px'}}><label>Address:</label><br/><input name="address" value={formData.address} onChange={handleChange} required /></div>
                <button type="submit">Register Shop</button>
            </form>
            {message && <p style={{color: 'green', marginTop: '10px'}}>{message}</p>}
        </div>
    );
}

export default ShopRegistration;