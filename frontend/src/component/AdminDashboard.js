import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
// Updated icons to reflect IT/Hardware focus
import { FaUsers, FaFileExcel, FaSignOutAlt, FaEdit, FaTrash, FaFilter, FaTimes, FaPlus, FaFileImport, FaUserCircle, FaUser, FaClipboard, FaLaptop } from 'react-icons/fa'; 
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = ({ setRole }) => {
    // STATE VARIABLES RENAMED: 'sureties' -> 'hardware'
    const [view, setView] = useState('users');
    const [users, setUsers] = useState([]);
    const [hardware, setHardware] = useState([]); // RENAMED
    const [filter, setFilter] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [modalType, setModalType] = useState('user');
    const [isEditing, setIsEditing] = useState(false);
    const [loadingType, setLoadingType] = useState(null);
    const [adminUser, setAdminUser] = useState(null);

    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    // Ensure this environment variable is correctly set
    const backend_Url = process.env.REACT_APP_BACKEND_URL

    const userFileInputRef = useRef(null);
    const hardwareFileInputRef = useRef(null); // RENAMED REF

    const policeStations = [
        "Malegaon", "Manmad", "Manmad Railway", "Nashik City", "Nashik Road", "Gangapur", "Panchavati",
        "Niphad", "Igatpuri", "Ghoti", "Wadivarhe", "Ozar", "Pimpalgaon Baswant",
        "Sinnar", "Laslgaon", "Wavi", "Saykheda", "MIDC Sinner", "Yeola", "Nandgaon",
        "Chandwad", "Vadner Bhairav", "Trimbakeshwar", "Harsul", "Kalwan", "Dindori",
        "Vani", "Abhona", "Surgana", "Deola", "Satana", "Vadner Khakurdi", "Jaikheda",
        "Azadnagar", "Ayeshnagar", "Pawarwadi", "Ramjanpura", "Malegaon Camp", "Malegaon Killa", "Malegaon Chavani"
    ];

    const config = {
        headers: { 'x-auth-token': token },
    };

    useEffect(() => {
        // fetchAdminData();
        if (view === 'users') {
            fetchUsers();
        } else if (view === 'hardware') { // RENAMED VIEW CHECK
            fetchHardware();
        }
    }, [view]);

    const fetchAdminData = async () => {
        try {
            const response = await axios.get(backend_Url + '/api/admin/me', config);
            setAdminUser(response.data);
        } catch (error) {
            console.error('Failed to fetch admin data.');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(backend_Url + '/api/admin/users', config);
            setUsers(response.data);
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to fetch users.');
        }
    };

    // API CALLS RENAMED: 'fetchSureties' -> 'fetchHardware'
    const fetchHardware = async () => { 
        try {
            const response = await axios.get(backend_Url + '/api/admin/hardware', config); // RENAMED ENDPOINT
            setHardware(response.data); // SETS NEW STATE
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Failed to fetch hardware records.');
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        localStorage.removeItem('role');
        navigate('/');
        toast.info('Logged out successfully!');
    };

    // CRUD HANDLERS RENAMED & FIELD NAMES UPDATED
    const handleCreate = (type) => {
        setModalType(type);
        setIsEditing(false);
        if (type === 'user') {
            setCurrentRecord({
                fullName: '', dob: '', mobileNo: '', village: '', emailId: '',
            });
        } else {
            // Hardware fields initialized (mapped from old surety fields)
            setCurrentRecord({
                itemName: '', 
                serialNo: '', 
                courtCity: '', 
                policeStation: '', 
                assetTag: '', 
                manufacturer: '', 
                model: '', 
                allocatedTo: '', 
                department: '', 
                hardwareCount: '', 
                deliveryDate: '', 
            });
        }
        setIsModalOpen(true);
    };

    const handleEditClick = (record, type) => {
        setModalType(type);
        setIsEditing(true);
        if (type === 'user' && record.dob) {
            const formattedDob = record.dob.split('T')[0];
            setCurrentRecord({ ...record, dob: formattedDob });
        } else if (type === 'hardware' && record.deliveryDate) { // RENAMED TYPE and FIELD
            const formattedDeliveryDate = record.deliveryDate.split('T')[0]; // RENAMED FIELD
            setCurrentRecord({ ...record, deliveryDate: formattedDeliveryDate }); // RENAMED FIELD
        }
        else {
            setCurrentRecord(record);
        }
        setIsModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            if (modalType === 'user') {
                const url = isEditing
                    ? `${backend_Url}/api/admin/users/${currentRecord._id}`
                    : `${backend_Url}/api/admin/users`;
                const method = isEditing ? 'put' : 'post';
                await axios[method](url, currentRecord, config);
                toast.success(`User ${isEditing ? 'updated' : 'created'} successfully!`);
                fetchUsers();
            } else {
                // HARDWARE LOGIC UPDATED
                const url = isEditing
                    ? `${backend_Url}/api/admin/hardware/${currentRecord._id}` // RENAMED ENDPOINT
                    : `${backend_Url}/api/admin/hardware`; // RENAMED ENDPOINT
                const method = isEditing ? 'put' : 'post';
                await axios[method](url, currentRecord, config);
                toast.success(`Hardware Record ${isEditing ? 'updated' : 'created'} successfully!`); // RENAMED MESSAGE
                fetchHardware(); // RENAMED FETCH FUNCTION
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.msg || 'Update failed.');
        }
    };

    const handleDelete = async (id, type) => {
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                if (type === 'user') {
                    await axios.delete(`${backend_Url}/api/admin/users/${id}`, config);
                    toast.success('User deleted successfully!');
                    fetchUsers();
                } else {
                    // HARDWARE LOGIC UPDATED
                    await axios.delete(`${backend_Url}/api/admin/hardware/${id}`, config); // RENAMED ENDPOINT
                    toast.success('Hardware record deleted successfully!'); // RENAMED MESSAGE
                    fetchHardware(); // RENAMED FETCH FUNCTION
                }
            } catch (error) {
                toast.error(error.response?.data?.msg || 'Delete failed.');
            }
        }
    };

    // IMPORT HANDLERS RENAMED
    const handleUserFileImport = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLoadingType('user');
            const formData = new FormData();
            formData.append('file', file);

            axios.post(backend_Url + '/api/admin/users/import', formData, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data',
                },
            })
                .then(response => {
                    toast.success(response.data.msg);
                    fetchUsers();
                })
                .catch(error => {
                    toast.error(error.response?.data?.msg || 'Import failed. Check file format and server.');
                    console.error('Import error:', error);
                })
                .finally(() => {
                    setLoadingType(null);
                    if (userFileInputRef.current) {
                        userFileInputRef.current.value = null;
                    }
                });
        }
    };

    const handleHardwareFileImport = (e) => { // RENAMED FUNCTION
        const file = e.target.files[0];
        if (file) {
            setLoadingType('hardware'); // RENAMED TYPE
            const formData = new FormData();
            formData.append('file', file);

            axios.post(backend_Url + '/api/admin/hardware/import', formData, { // RENAMED ENDPOINT
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data',
                },
            })
                .then(response => {
                    toast.success(response.data.msg);
                    fetchHardware(); // RENAMED FETCH FUNCTION
                })
                .catch(error => {
                    toast.error(error.response?.data?.msg || 'Import failed. Check file format and server.');
                    console.error('Import error:', error);
                })
                .finally(() => {
                    setLoadingType(null);
                    if (hardwareFileInputRef.current) { // RENAMED REF
                        hardwareFileInputRef.current.value = null;
                    }
                });
        }
    };

    // EXPORT HANDLERS RENAMED & FIELD NAMES UPDATED
    const exportToExcel = (data, fileName) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(dataBlob, fileName);
    };

    const handleExportUsers = () => {
        const usersData = filteredUsers.map(user => ({
            "Full Name": user.fullName,
            "Mobile No.": user.mobileNo,
            "DOB": user.dob.split('T')[0],
            "Village": user.village,
            "Email ID": user.emailId,
        }));
        exportToExcel(usersData, "User List.xlsx");
    };

    const handleExportHardware = () => { // RENAMED FUNCTION
        const hardwareData = filteredHardware.map(item => ({ // RENAMED VARIABLE
            "Item Name": item.itemName, 
            "Serial No.": item.serialNo, 
            "Court City": item.courtCity, 
            "Police Station": item.policeStation,
            "Asset Tag": item.assetTag, 
            "Manufacturer": item.manufacturer, 
            "Model": item.model, 
            "Allocated To": item.allocatedTo, 
            "Department": item.department, 
            "Hardware Count": item.hardwareCount, 
            "Delivery Date": item.deliveryDate ? item.deliveryDate.split('T')[0] : '', 
        }));
        exportToExcel(hardwareData, "Hardware List.xlsx"); // RENAMED FILE
    };

    // FILTER LOGIC RENAMED & FIELDS UPDATED
    const filteredUsers = users.filter(user =>
        (user.mobileNo?.toLowerCase().includes(filter.toLowerCase())) ||
        (user.dob?.toLowerCase().includes(filter.toLowerCase())) ||
        (user.fullName?.toLowerCase().includes(filter.toLowerCase())) ||
        (user.emailId?.toLowerCase().includes(filter.toLowerCase()))
    );

    const filteredHardware = hardware.filter(item => // RENAMED VARIABLE
        (item.itemName?.toLowerCase().includes(filter.toLowerCase())) || // RENAMED FIELD
        (item.serialNo?.toLowerCase().includes(filter.toLowerCase())) || // RENAMED FIELD
        (item.assetTag?.toLowerCase().includes(filter.toLowerCase())) // RENAMED FIELD
    );

    // MODAL RENDER FUNCTION - UI FIELD LABELS UPDATED
    const renderModal = () => {
        if (!isModalOpen) return null;
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl p-8 shadow-xl relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
                        <FaTimes size={24} />
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{isEditing ? `Edit ${modalType}` : `Add New ${modalType}`}</h2>

                    <form onSubmit={handleUpdate}>
                        {modalType === 'user' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl shadow-inner border border-gray-200">
                                <div className="flex flex-col">
                                    <label htmlFor="fullName" className="text-sm font-medium text-gray-600">Full Name</label>
                                    <input type="text" id="fullName" name="fullName" placeholder="Full Name" value={currentRecord?.fullName || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, fullName: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="mobileNo" className="text-sm font-medium text-gray-600">Mobile No.</label>
                                    <input type="text" id="mobileNo" name="mobileNo" placeholder="Mobile No." value={currentRecord?.mobileNo || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, mobileNo: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" maxLength="10" />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="dob" className="text-sm font-medium text-gray-600">Date of Birth</label>
                                    <input type="date" id="dob" name="dob" value={currentRecord?.dob || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, dob: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="village" className="text-sm font-medium text-gray-600">Village / Court City</label>
                                    <select id="village" name="village" value={currentRecord?.village || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, village: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                                        <option value="">Select Village / City</option>
                                        {policeStations.map(station => <option key={station} value={station}>{station}</option>)}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label htmlFor="emailId" className="text-sm font-medium text-gray-600">Email ID</label>
                                    <input type="email" id="emailId" name="emailId" placeholder="Email ID" value={currentRecord?.emailId || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, emailId: e.target.value })} className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>
                        ) : (
                            // HARDWARE Form
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-6 rounded-2xl shadow-inner border border-gray-200">
                                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Hardware Details</h3>
                                    <div className="space-y-4">
                                        <div className="flex flex-col">
                                            <label htmlFor="itemName" className="text-sm font-medium text-gray-600">Item Name (e.g., Laptop, Printer)</label>
                                            <input type="text" id="itemName" name="itemName" value={currentRecord?.itemName || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, itemName: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="serialNo" className="text-sm font-medium text-gray-600">Serial Number</label>
                                            <input type="text" id="serialNo" name="serialNo" value={currentRecord?.serialNo || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, serialNo: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="assetTag" className="text-sm font-medium text-gray-600">Asset Tag/Inventory No.</label>
                                            <input type="text" id="assetTag" name="assetTag" value={currentRecord?.assetTag || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, assetTag: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="manufacturer" className="text-sm font-medium text-gray-600">Manufacturer (e.g., Dell, HP)</label>
                                            <input type="text" id="manufacturer" name="manufacturer" value={currentRecord?.manufacturer || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, manufacturer: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="model" className="text-sm font-medium text-gray-600">Model</label>
                                            <input type="text" id="model" name="model" value={currentRecord?.model || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, model: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="hardwareCount" className="text-sm font-medium text-gray-600">Quantity</label>
                                            <input type="number" id="hardwareCount" name="hardwareCount" placeholder="e.g., 1" value={currentRecord?.hardwareCount || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, hardwareCount: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="deliveryDate" className="text-sm font-medium text-gray-600">Delivery Date</label>
                                            <input type="date" id="deliveryDate" name="deliveryDate" value={currentRecord?.deliveryDate || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, deliveryDate: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-6 rounded-2xl shadow-inner border border-gray-200">
                                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Location/Allocation</h3>
                                    <div className="space-y-4">
                                        <div className="flex flex-col">
                                            <label htmlFor="courtCity" className="text-sm font-medium text-gray-600">Court City / Location</label>
                                            <input type="text" id="courtCity" name="courtCity" value={currentRecord?.courtCity || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, courtCity: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="policeStation" className="text-sm font-medium text-gray-600">Police Station (if applicable)</label>
                                            <select id="policeStation" name="policeStation" value={currentRecord?.policeStation || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, policeStation: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                                                <option value="">Select Station/Office</option>
                                                {policeStations.map(station => <option key={station} value={station}>{station}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="allocatedTo" className="text-sm font-medium text-gray-600">Allocated To (User/Officer Name)</label>
                                            <input type="text" id="allocatedTo" name="allocatedTo" value={currentRecord?.allocatedTo || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, allocatedTo: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <label htmlFor="department" className="text-sm font-medium text-gray-600">Department/Section</label>
                                            <input type="text" id="department" name="department" value={currentRecord?.department || ''} onChange={(e) => setCurrentRecord({ ...currentRecord, department: e.target.value })} required className="p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                        </div>
                                        <div className="h-4"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end space-x-4 mt-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                                {isEditing ? 'Save Changes' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    // RENDER SECTION - UI UPDATES
    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
            <ToastContainer />
            {/* Sidebar */}
            <div className="hidden md:flex w-64 bg-white border-r border-gray-200 p-6 flex-col shadow-lg">
                <div className="flex items-center mb-8">
                    <FaLaptop className="text-3xl text-indigo-600 mr-3" /> 
                    <h1 className="text-2xl font-bold">Admin Panel</h1>
                </div>
                <div className="flex items-center p-4 bg-gray-100 rounded-lg mb-6">
                    <FaUserCircle className="text-4xl text-indigo-600 mr-3" />
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Logged in as</span>
                        <span className="font-semibold text-gray-800">{adminUser?.fullName || adminUser?.mobileNo || 'Admin'}</span>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <button
                        onClick={() => setView('users')}
                        className={`w-full flex items-center p-3 rounded-lg font-medium transition-colors duration-200 ${view === 'users' ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FaUser className="mr-4 text-xl" />
                        Manage Users
                    </button>
                    <button
                        onClick={() => setView('hardware')} 
                        className={`w-full flex items-center p-3 rounded-lg font-medium transition-colors duration-200 ${view === 'hardware' ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' : 'text-gray-600 hover:bg-gray-100'}`} 
                    >
                        <FaClipboard className="mr-4 text-xl" /> 
                        Manage Hardware
                    </button>
                </nav>
                <div className="mt-auto pt-6 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center p-3 rounded-lg font-medium text-white bg-red-600 hover:bg-red-700 transition-colors duration-300 shadow-lg"
                    >
                        <FaSignOutAlt className="mr-2" /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 sm:p-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900">
                            {view === 'users' ? 'User Management' : 'Hardware Management'} 
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {view === 'users' ? 'Manage and edit user accounts.' : 'Manage and view all hardware inventory records.'} 
                        </p>
                    </div>
                    <div className="flex space-x-3 mt-4 md:mt-0">
                        {view === 'users' ? (
                            <>
                                <button
                                    onClick={() => handleCreate('user')}
                                    className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold flex items-center hover:bg-indigo-700 transition-all duration-300 shadow-lg"
                                >
                                    <FaPlus className="mr-2" /> Add User
                                </button>
                                {/* Removed file import label to reduce clutter, uncomment if needed */}
                                {/* <label htmlFor="user-file-import" className="px-6 py-2 rounded-xl bg-green-600 text-white font-semibold flex items-center hover:bg-green-700 transition-all duration-300 shadow-lg cursor-pointer">
                                    <FaFileImport className="mr-2" /> Import
                                    <input type="file" id="user-file-import" accept=".xlsx, .xls" onChange={handleUserFileImport} className="hidden" ref={userFileInputRef} />
                                </label> */}
                                <button
                                    onClick={handleExportUsers}
                                    className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold flex items-center hover:bg-blue-700 transition-all duration-300 shadow-lg"
                                >
                                    <FaFileExcel className="mr-2" /> Export
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => handleCreate('hardware')} 
                                    className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold flex items-center hover:bg-indigo-700 transition-all duration-300 shadow-lg"
                                >
                                    <FaPlus className="mr-2" /> Add Hardware
                                </button>
                                <label htmlFor="hardware-file-import" className="px-6 py-2 rounded-xl bg-green-600 text-white font-semibold flex items-center hover:bg-green-700 transition-all duration-300 shadow-lg cursor-pointer">
                                    <FaFileImport className="mr-2" /> Import
                                    <input type="file" id="hardware-file-import" accept=".xlsx, .xls" onChange={handleHardwareFileImport} className="hidden" ref={hardwareFileInputRef} /> 
                                </label>
                                <button
                                    onClick={handleExportHardware} 
                                    className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold flex items-center hover:bg-blue-700 transition-all duration-300 shadow-lg"
                                >
                                    <FaFileExcel className="mr-2" /> Export
                                </button>
                            </>
                        )}
                    </div>
                </header>

                <div className="bg-white p-6 rounded-3xl shadow-xl">
                    <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700">
                        <FaFilter className="mr-2" /> Filter Records
                    </h3>
                    <div className="mb-6 relative">
                        <input
                            type="text"
                            placeholder={view === 'users' ? "Filter by mobile number, DOB, name, or email..." : "Filter by item name, serial no, or asset tag..."} 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div className="overflow-x-auto rounded-xl shadow-inner-lg" style={{ maxHeight: "calc(100vh - 350px)" }}>
                        {view === 'users' && (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Full Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mobile No.</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">DOB</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Village</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email ID</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{user.fullName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{user.mobileNo}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{user.dob.split('T')[0]}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{user.village}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{user.emailId}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => handleEditClick(user, 'user')} className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                                                            <FaEdit />
                                                        </button>
                                                        <button onClick={() => handleDelete(user._id, 'user')} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-4 px-6 text-center text-gray-500">No users found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {view === 'hardware' && ( 
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Name</th> 
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Serial No.</th> 
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Asset Tag</th> 
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Manufacturer</th> 
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Allocated To</th> 
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quantity</th> 
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Delivery Date</th> 
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredHardware.length > 0 ? ( 
                                        filteredHardware.map(item => ( 
                                            <tr key={item._id} className="hover:bg-gray-50 transition-colors duration-200">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.itemName}</td> 
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.serialNo}</td> 
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.assetTag}</td> 
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.manufacturer}</td> 
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.allocatedTo}</td> 
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.hardwareCount}</td> 
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.deliveryDate ? item.deliveryDate.split('T')[0] : '-'}</td> 
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex space-x-2">
                                                        <button onClick={() => handleEditClick(item, 'hardware')} className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"> 
                                                            <FaEdit />
                                                        </button>
                                                        <button onClick={() => handleDelete(item._id, 'hardware')} className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"> 
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="py-4 px-6 text-center text-gray-500">No hardware records found.</td> 
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
            {renderModal()}
        </div>
    );
};

export default AdminDashboard;