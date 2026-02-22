import "./style.css";

const MultiSelect = ({ selectedUsers, setSelectedUsers, usernames }) => {
  const handleSelect = (e) => {
    const user = e.target.value;
    if (user && !selectedUsers.includes(user)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    e.target.value = ""; // reset select after choosing
  };

  return (
    <div className="multi-select-container">
      <label className="multi-select-label">Choose Users</label>

      {/* Read-only input with selected users */}
      <input
        type="text"
        className="multi-select-input"
        value={selectedUsers.join(", ")}
        readOnly
        placeholder="No users selected"
      />

      {/* Dropdown to add new users */}
      <select className="multi-select-select" onChange={handleSelect}>
        <option value="">-- Select User --</option>
        {usernames
          .filter((user) => !selectedUsers.includes(user?.username))
          .map((user) => (
            <option key={user?.username} value={user?.username}>
              {user?.username}
            </option>
          ))}
      </select>
    </div>
  );
};

export default MultiSelect;
