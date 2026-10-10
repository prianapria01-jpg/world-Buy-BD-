import { useState, useEffect, type FormEvent } from "react";
import { UserCheck, Plus, Trash2, Edit, Shield, CheckCircle, XCircle, Phone, Mail, Clock } from "lucide-react";

export default function AdminSubAdmins() {
  const [subadmins, setSubadmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const handleUpdatePassword = async (e: any) => {
    e.preventDefault();
    if (!editingId || !newPassword) return;
    try {
      const res = await fetch(`/api/admin/subadmins/${editingId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      if (res.ok) {
        alert("Password updated successfully!");
        setEditingId(null);
        setNewPassword("");
        loadSubadmins();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to update password");
    }
  };

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Order & Fulfillment Manager");
  const [permissions, setPermissions] = useState<string[]>([
    "orders_view",
    "orders_status",
    "view_proof"
  ]);

  const loadSubadmins = () => {
    setLoading(true);
    fetch("/api/subadmins")
      .then(res => res.json())
      .then(data => {
        setSubadmins(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSubadmins();
  }, []);

  const handlePermissionToggle = (perm: string) => {
    setPermissions(prev => 
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  
  const handleAutoCreateSalesPersons = async () => {
    
    // Seed radowan121537@gmail.com first
    const salesPersons = [
      { name: "Radowan", phone: "01700000001", email: "radowan121537@gmail.com", password: "1215375123", role: "Sales Person", permissions: ["orders_view", "orders_status"] }
    ];

    for (let i = 2; i <= 10; i++) {
      salesPersons.push({
        name: `Sales Person ${i}`,
        phone: `0170000000${i}`,
        email: `sales${i}@worldbuybd.com`,
        password: `sales1234${i}`,
        role: "Sales Person",
        permissions: ["orders_view", "orders_status"]
      });
    }

    try {
      for (const sp of salesPersons) {
        await fetch("/api/admin/subadmins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sp)
        });
      }
      alert("10 Sales Persons created successfully!");
      loadSubadmins();
    } catch (e) {
      console.error(e);
      alert("Error creating sales persons");
    }
  };

  const handleAddSubadmin = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    try {
      const res = await fetch("/api/subadmins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          role,
          permissions,
          status: "active"
        })
      });
      if (res.ok) {
        setName("");
        setEmail("");
      setPassword("");
        setPhone("");
        setShowModal(false);
        loadSubadmins();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await fetch(`/api/subadmins/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      loadSubadmins();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, _subName: string) => {
    try {
      await fetch(`/api/subadmins/${encodeURIComponent(id)}`, { method: "DELETE" });
      loadSubadmins();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-charcoal flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-primary" />
            Sub-Admin Panel & Permissions Control
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Assign specific tasks and responsibilities to your team members
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add New Sub-Admin
        </button>
      </div>

      {/* Grid of Sub-Admins */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {subadmins.map((sub) => (
          <div key={sub.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-charcoal text-sm">{sub.name}</h3>
                    <span className="text-[11px] text-primary font-semibold block">{sub.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleStatus(sub.id, sub.status)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    sub.status === "active" 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {sub.status === "active" ? "Active" : "Inactive"}
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 py-3 border-y border-gray-100 mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span>{sub.phone}</span>
                </div>
                {sub.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{sub.email}</span>
                  </div>
                )}
              </div>

              {/* Permissions Tags */}
              <div className="mb-4">
                <div className="text-[11px] font-bold text-gray-500 mb-1.5">Allowed Permissions:</div>
                <div className="flex flex-wrap gap-1">
                  {(sub.permissions || []).map((perm: string) => (
                    <span key={perm} className="bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-md">
                      {perm === "orders_view" && "View Orders"}
                      {perm === "orders_status" && "Change Order Status"}
                      {perm === "view_proof" && "View Payment Receipts"}
                      {perm === "products_add" && "Add Products"}
                      {perm === "scraper_run" && "Run Extractor"}
                      {perm === "categories_edit" && "Manage Categories"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              
              <button
                onClick={() => setEditingId(sub.id)}
                className="text-xs text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition"
                title="Change Password"
              >
                Change Pass
              </button>
              <button
                onClick={() => handleDelete(sub.id, sub.name)}

                className="text-xs text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-charcoal mb-4">Add New Sub-Admin</h3>
            <form onSubmit={handleAddSubadmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Sub-Admin Full Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Md. Tanvir Ahmed" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Mobile Number *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="017XXXXXXXX" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-charcoal mb-1">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="subadmin@worldbuybd.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">Designation & Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-none bg-white"
                >
                  <option value="Order & Fulfillment Manager">Order & Fulfillment Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="CS">CS (Customer Service)</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Sales Person">Sales Person</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-2">Select Permissions:</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "orders_view", label: "View Orders" },
                    { id: "orders_status", label: "Change Order Status" },
                    { id: "view_proof", label: "View Payment Receipts & TrxID" },
                    { id: "products_add", label: "Add Products" },
                    { id: "scraper_run", label: "Run Extractor" },
                    { id: "categories_edit", label: "Edit Categories" }
                  ].map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input 
                        type="checkbox"
                        checked={permissions.includes(p.id)}
                        onChange={() => handlePermissionToggle(p.id)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span className="text-[11px] font-medium text-gray-700">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold"
                >
                  Save Sub-Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Password Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-charcoal mb-4">Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">New Password</label>
                <input 
                  type="text" 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => {setEditingId(null); setNewPassword("")}}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
