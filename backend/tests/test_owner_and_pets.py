def register(client, email="maruf@example.com", name="Maruf Hossain"):
    r = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": "password123"},
    )
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['token']}"}


def test_owner_profile_get_and_update(client):
    auth_headers = register(client, "owner1@example.com", "Maruf Hossain")

    # Get profile initially
    res = client.get("/api/owner/profile", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Maruf Hossain"
    assert data["email"] == "owner1@example.com"
    assert data["totalPets"] == 0
    assert data["phone"] is None

    # Update owner profile
    update_payload = {
        "name": "Maruf Hossain (Updated)",
        "phone": "+8801700000000",
        "address": "Dhaka, Bangladesh",
        "bio": "Passionate pet lover and golden retriever owner.",
        "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
        "emergencyContact": "+8801800000000 (Dr. Vet Clinic)",
    }
    update_res = client.put(
        "/api/owner/profile", json=update_payload, headers=auth_headers
    )
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["name"] == "Maruf Hossain (Updated)"
    assert updated_data["phone"] == "+8801700000000"
    assert updated_data["address"] == "Dhaka, Bangladesh"
    assert updated_data["emergencyContact"] == "+8801800000000 (Dr. Vet Clinic)"


def test_pet_crud_and_isolation(client):
    auth1 = register(client, "ownerA@example.com", "Alice")
    auth2 = register(client, "ownerB@example.com", "Bob")

    # Create Pet for Alice
    pet_payload = {
        "name": "Milo",
        "species": "Dog",
        "breed": "Golden Retriever",
        "age": "2 years",
        "gender": "Male",
        "weight": "28 kg",
        "photoUrl": "https://images.unsplash.com/photo-1552053831-71594a27632d",
        "careNotes": "Loves daily morning fetch. Mild allergy to poultry, fed salmon kibble only.",
    }
    create_res = client.post("/api/pets", json=pet_payload, headers=auth1)
    assert create_res.status_code == 201
    created_pet = create_res.json()
    pet_id = created_pet["id"]
    assert created_pet["name"] == "Milo"
    assert created_pet["species"] == "Dog"
    assert created_pet["breed"] == "Golden Retriever"

    # Profile shows totalPets = 1
    prof_res = client.get("/api/owner/profile", headers=auth1)
    assert prof_res.json()["totalPets"] == 1

    # List pets for Alice
    list_res = client.get("/api/pets", headers=auth1)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # Bob should not see Alice's pet
    assert client.get("/api/pets", headers=auth2).json() == []
    assert client.get(f"/api/pets/{pet_id}", headers=auth2).status_code == 404

    # Update Milo
    pet_payload["weight"] = "29 kg"
    pet_payload["careNotes"] = "Updated: Vaccinated on Nov 2026."
    upd_res = client.put(f"/api/pets/{pet_id}", json=pet_payload, headers=auth1)
    assert upd_res.status_code == 200
    assert upd_res.json()["weight"] == "29 kg"

    # Delete Milo
    del_res = client.delete(f"/api/pets/{pet_id}", headers=auth1)
    assert del_res.status_code == 204
    assert client.get(f"/api/pets/{pet_id}", headers=auth1).status_code == 404
