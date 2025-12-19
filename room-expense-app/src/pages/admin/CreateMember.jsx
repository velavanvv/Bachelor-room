import { useState } from "react";
import api from "../../api/axios";

export default function CreateMember() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/admin/create-member", form);
    alert("Member created successfully");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Member</h2>
      {Object.keys(form).map(key => (
        <input
          key={key}
          placeholder={key}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
        />
      ))}
      <button>Create</button>
    </form>
  );
}
