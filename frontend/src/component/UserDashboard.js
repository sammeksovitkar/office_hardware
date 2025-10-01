import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
    FaPlus, FaSignOutAlt, FaFilter, FaFileExcel, FaHome, FaUserCircle, 
    FaTimesCircle, FaDesktop, FaBuilding, FaUserTie, FaCalendarAlt, FaTrashAlt, FaInfoCircle
} from 'react-icons/fa';
import { MdOutlineSecurity, MdNumbers } from 'react-icons/md';

// --- Assuming these components/paths are correct ---
import HardwareModal from './HardwareModal'; 
import HardwareList from './HardwareList'; 

// --- Constants (Keeping your original court names) ---
export const HARDWARE_OPTIONS = [
    'CPU', 'Monitor', 'Keyboard', 'Mouse', 'LCD', 'Scanner', 'Printer', 'Other'
];

export const COURT_STATIONS = [
    "Malegaon",
    "Nandgaon",
    "Satana",
    "Niphad",
    "Yeola",
    "Chandwad",
    "Pimpalgaon (B)",
    "Manmad City",
    "Manmad (Rly)",
    "Sinnar",
    "Dindori",
    "Kalwan",
    "Nashik-Road",
    "Vehicle Section", // Changed "Motor Vehicle Court" to "Vehicle Section" for brevity
    "Malegaon Sessions Division", // Kept specific functional names for clarity
    "Niphad Sessions Division", 
    "Nashik Dist Court"
];

// ----------------------------------------------------------------
// --- Utility Components (Refined for Admin Dashboard Look) ---
// ----------------------------------------------------------------

const MessageComponent = ({ message, type }) => {
    if (!message) return null;
    // Uses shadow-lg and rounded-xl consistent with Admin UI
    const baseClasses = "py-3 px-6 rounded-xl font-medium text-white mb-4 transition-all duration-300 transform animate-fade-in flex items-center shadow-lg"; 
    const typeClasses = type === "success" ? "bg-green-500" : "bg-red-600";
    const Icon = type === "success" ? FaDesktop : FaTimesCircle;
    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            <Icon className="mr-3 text-xl"/>
            {message}
        </div>
    );
};

const FormInput = ({ label, id, name, value, onChange, type = 'text', required = false, error, children, icon: Icon, placeholder }) => (
    <div className="flex flex-col mb-4"> 
        <label htmlFor={id} className="text-sm font-medium text-gray-700 flex items-center mb-1"> 
            {Icon && <Icon className="mr-2 text-indigo-500 text-sm" />}
            {label} {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
            {children ? children : (
                <input
                    type={type}
                    id={id}
                    name={name} 
                    value={value}
                    onChange={onChange}
                    required={required}
                    placeholder={placeholder} 
                    // Matches the focus ring and border style from Admin Panel
                    className={`w-full p-3 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-lg transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm`}
                />
            )}
        </div>
        {error && <p className="text-red-500 text-xs mt-0.5 italic">{error}</p>}
    </div>
);

// --- INFO MODAL COMPONENT (High-end Admin Look) ---
const InfoModal = ({ record, onClose }) => {
    if (!record) return null;

    const metadataFields = [
        { label: "Court Name", value: record.courtName, icon: FaBuilding },
        { label: "Company Name", value: record.companyName, icon: FaBuilding },
        { label: "Source", value: record.source, icon: FaUserTie },
        { label: "Dead Stock Reg. Sr. No.", value: record.deadStockRegSrNo, icon: MdOutlineSecurity },
        { label: "Dead Stock Book Page No.", value: record.deadStockBookPageNo, icon: MdNumbers },
        { label: "Delivery Date", value: record.deliveryDate ? new Date(record.deliveryDate).toLocaleDateString() : 'N/A', icon: FaCalendarAlt },
        { label: "Installation Date", value: record.installationDate ? new Date(record.installationDate).toLocaleDateString() : 'N/A', icon: FaCalendarAlt },
        { label: "Allocated Employee", value: record.employeeAllocated?.fullName || 'N/A', icon: FaUserCircle },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            {/* Modal Body: Large padding, rounded-3xl, shadow-2xl for premium look */}
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] transform transition-all duration-300 scale-100">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b pb-3">
                    <h2 className="text-2xl font-extrabold text-indigo-700 flex items-center">
                        <FaInfoCircle className="mr-3 text-xl"/> Hardware Details: <span className="ml-2 text-gray-800 italic font-semibold">{record.hardwareName}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-colors text-2xl p-1 ml-2">
                        <FaTimesCircle />
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Column 1: Metadata (Light Blue Panel for Info) */}
                    <div className="bg-blue-50 p-5 rounded-xl shadow-inner border border-blue-200">
                        <h3 className="text-lg font-bold text-blue-800 mb-4 border-b border-blue-300 pb-2">General Information</h3>
                        {metadataFields.map((field, index) => (
                            <div key={index} className="flex items-start mb-3 text-sm">
                                <span className="w-1/2 font-semibold text-gray-700 flex items-center">
                                    <field.icon className="mr-2 text-blue-500 text-base"/> {field.label}:
                                </span>
                                <span className="w-1/2 text-gray-900 font-medium">{field.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Column 2: Hardware Specifics (Light Gray Panel for Details) */}
                    <div className="bg-gray-100 p-5 rounded-xl shadow-inner border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-300 pb-2 flex items-center">
                            <FaDesktop className="mr-2"/> Hardware Item
                        </h3>
                        <div className="space-y-4">
                            <div className="text-xl font-extrabold text-indigo-700 border-b pb-2">
                                {record.hardwareName}
                            </div>
                            <div className="text-base">
                                <span className="font-semibold text-gray-700">Serial Number:</span>
                                <span className="ml-2 font-mono text-gray-900 bg-gray-200 p-1 rounded text-sm">{record.serialNumber}</span>
                            </div>
                            <p className="text-xs text-gray-500 pt-3 border-t mt-3">
                                Item ID: {record._id} 
                                {record.parentId && (<span className="ml-3">Parent Record ID: {record.parentId}</span>)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// ----------------------------------------------------------------
// --- Main Dashboard Component ---
// ----------------------------------------------------------------

const UserDashboard = () => {
    
    const [user, setUser] = useState(null);
    const [hardwareRecords, setHardwareRecords] = useState([]); 
    
    // State for the main form data
    const initialFormData = {
        _id: null, 
        parentId: null, 
        courtName: '', companyName: '', deliveryDate: '', installationDate: '', 
        deadStockRegSrNo: '', deadStockBookPageNo: '', source: '',
        hardwareItems: [{ hardwareName: '', manualHardwareName: '', serialNumber: '' }]
    };
    const [formData, setFormData] = useState(initialFormData);
    
    const [showModal, setShowModal] = useState(false); 
    const [showInfoModal, setShowInfoModal] = useState(false); 
    const [editingRecord, setEditingRecord] = useState(null); 

    const [filters, setFilters] = useState({ name: '', court: '', serialNo: '', company: '' });
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [serialErrors, setSerialErrors] = useState({}); 
    
    const navigate = useNavigate();
    const backend_Url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'; 

    const token = localStorage.getItem('token');
    const config = { headers: { 'x-auth-token': token } };

    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    useEffect(() => {
        fetchUserData();
        fetchHardwareRecords(); 
    }, []);

    // --- Data Fetching ---

    const fetchUserData = async () => {
        try {
            const res = await axios.get(backend_Url + '/api/user/me', config);
            setUser(res.data);
        } catch (err) {
            console.error('Failed to fetch user data');
        }
    };

    const fetchHardwareRecords = async () => {
        try {
            const res = await axios.get(backend_Url + '/api/user/allhardware', config); 
            setHardwareRecords(res.data);
        } catch (err) {
            showMessage('Failed to fetch hardware records. Please ensure you have the necessary permissions.', 'error');
        }
    };

    // --- Form/Modal Handlers ---

    const handleMainFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleHardwareItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = formData.hardwareItems.map((item, i) => {
            if (i === index) {
                const updatedItem = { ...item, [name]: value };
                if (name === 'hardwareName' && value !== 'Other') {
                    updatedItem.manualHardwareName = '';
                }
                return updatedItem;
            }
            return item;
        });

        setFormData({ ...formData, hardwareItems: newItems });
    };
    
    const addHardwareItem = () => {
        setFormData({
            ...formData,
            hardwareItems: [...formData.hardwareItems, { hardwareName: '', manualHardwareName: '', serialNumber: '',company:'' }]
        });
    };

    const removeHardwareItem = (index) => {
        const newItems = formData.hardwareItems.filter((_, i) => i !== index);
        setFormData({ ...formData, hardwareItems: newItems });
    };

    // Consolidated Submit/Update Handler
    const handleSubmitHardware = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                courtName: formData.courtName,
                companyName: formData.companyName,
                deliveryDate: formData.deliveryDate,
                installationDate: formData.installationDate,
                deadStockRegSrNo: formData.deadStockRegSrNo,
                deadStockBookPageNo: formData.deadStockBookPageNo,
                source: formData.source,
                employeeAllocated:formData.employeeAllocated,
                
                hardwareItems: formData.hardwareItems.map(item => ({
    _id: formData._id ? item._id : undefined, 
    
    // Maps the selected type or the manual input name
    hardwareName: item.hardwareName === 'Other' ? item.manualHardwareName : item.hardwareName,
    
    serialNumber: item.serialNumber,
    
    // ✅ SOLUTION: Add the company field here
    company: item.company, 
}))

            };

            if (formData._id && formData.parentId) {
                // EDIT LOGIC (PUT request)
                await axios.put(`${backend_Url}/api/user/hardware/${formData.parentId}`, payload, config);
                showMessage(`Hardware record ID ${formData._id} updated successfully! ✅`, 'success');
            } else {
                // CREATE LOGIC (POST request)
                await axios.post(backend_Url + '/api/user/hardware', payload, config); 
                showMessage('Hardware records created successfully! 🎉', 'success');
            }
            
            setFormData(initialFormData);
            setShowModal(false);
            fetchHardwareRecords(); 
        } catch (err) {
            const errMsg = err.response?.data?.msg || 'Operation failed. Check server logs.';
            showMessage(errMsg, 'error');
        }
    };


    // --- ACTION HANDLERS (Edit, Delete, Show) ---

const handleEdit = (id, parentId) => {
        const recordToEdit = hardwareRecords.find(h => h._id === id);
        
        if (recordToEdit) {
            const item = {
                hardwareName: HARDWARE_OPTIONS.includes(recordToEdit.hardwareName) ? recordToEdit.hardwareName : 'Other',
                manualHardwareName: recordToEdit.company,
                serialNumber: recordToEdit.serialNumber,
                _id: recordToEdit._id,
                
                // 🛠️ FIX: Explicitly map the flattened 'companyName' to the item's 'company' field
                company: recordToEdit.company, 
            };

            setFormData({
                _id: recordToEdit._id,
                parentId: recordToEdit.parentId,
                courtName: recordToEdit.courtName,
                
                // IMPORTANT: Ensure the top-level 'companyName' is also set for any metadata use.
                companyName: recordToEdit.companyName, 
                
                deliveryDate: recordToEdit.deliveryDate.split('T')[0],
                installationDate: recordToEdit.installationDate.split('T')[0],
                deadStockRegSrNo: recordToEdit.deadStockRegSrNo || '',
                deadStockBookPageNo: recordToEdit.deadStockBookPageNo || '',
                source: recordToEdit.source,
                hardwareItems: [item],
                employeeAllocated:recordToEdit.employeeAllocated
            });
            setShowModal(true);
        } else {
            showMessage(`Record ID ${id} not found locally.`, 'error');
        }
    };

    const handleDelete = async (id, parentId) => {
        if (!id || !parentId) {
            showMessage("Error: Missing Item ID or Parent ID for deletion.", 'error');
            return;
        }

        if (window.confirm(`Are you sure you want to permanently delete hardware item ID ${id} from record ${parentId}?`)) {
            try {
                await axios.delete(`${backend_Url}/api/user/hardware/${parentId}/${id}`, config);
                await showMessage(`Hardware item ID: ${id} deleted successfully. 🗑️`, 'success');
                await fetchHardwareRecords();
            } catch (err) {
                const errMsg = err.response?.data?.msg || 'Failed to delete record. Check API path or server logs.';
                showMessage(errMsg, 'error');
                await fetchHardwareRecords();
            }
        }
    };

    const handleShow = (id) => {
        const record = hardwareRecords.find(h => h._id === id);
        if (record) {
            setEditingRecord(record);
            setShowInfoModal(true);
        } else {
            showMessage(`Record ID ${id} not found.`, 'error');
        }
    };
    
    // --- Table Filtering & Export ---

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };
    
    const filteredHardware = hardwareRecords.filter((h) => {
        return (
            (!filters.name || h.hardwareName.toLowerCase().includes(filters.name.toLowerCase())) &&
            (!filters.serialNo || h.serialNumber.toLowerCase().includes(filters.serialNo.toLowerCase())) &&
            (!filters.court || h.courtName === filters.court) &&
            (!filters.company || h.companyName.toLowerCase().includes(filters.company.toLowerCase()))
        );
    });

    const exportToExcel = () => { 
        if (!filteredHardware.length) {
            showMessage('No data to export. Try clearing your filters.', 'error');
            return;
        }

        const dataToExport = filteredHardware.map(item => ({
            "Hardware Name": item.hardwareName,
            "Serial Number": item.serialNumber,
            "Court Name": item.courtName,
            "Company": item.companyName,
            "Delivery Date": item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString() : 'N/A',
            "Installation Date": item.installationDate ? new Date(item.installationDate).toLocaleDateString() : 'N/A',
            "Dead Stock Sr. No.": item.deadStockRegSrNo,
            "Dead Stock Page No.": item.deadStockBookPageNo,
            "Source": item.source,
            "Allocated Employee": item.employeeAllocated || 'N/A',
        }));
        
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Hardware Inventory");
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(dataBlob, "HardwareInventory_Export.xlsx");
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    // --- Render ---

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
            
            {/* Sidebar (Placeholder for full Admin/User consistency) */}
            <div className="hidden md:flex w-64 bg-white border-r border-gray-200 p-6 flex-col shadow-lg">
                <div className="flex items-center mb-8">
                    <FaDesktop className="text-3xl text-indigo-600 mr-3" /> 
                    <h1 className="text-2xl font-bold">IT Dashboard</h1>
                </div>
                <div className="flex items-center p-4 bg-gray-100 rounded-lg mb-6">
                    <FaUserCircle className="text-4xl text-indigo-600 mr-3" />
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Logged in as</span>
                        <span className="font-semibold text-gray-800">{user?.fullName || 'User'}</span>
                    </div>
                </div>
                <nav className="flex-1 space-y-2">
                    <button
                        className="w-full flex items-center p-3 rounded-lg font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-200"
                    >
                        <FaHome className="mr-4 text-xl" />
                        Inventory View
                    </button>
                    {/* Additional User Nav Links Here */}
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

            {/* Main Content Area */}
            <div className="flex-1 p-8 sm:p-10">
                
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-3 border-b border-gray-200">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900">Hardware Inventory</h1>
                        <p className="text-gray-500 mt-1">Manage and view all hardware assets allocated to this area.</p>
                    </div>
                    
                    <div className="flex space-x-3 mt-4 md:mt-0">
                        <button
                            onClick={() => {
                                setFormData(initialFormData); // Reset form data to create a new record
                                setShowModal(true);
                            }}
                            // Primary Indigo Button Style
                            className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-semibold flex items-center hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-300/50 text-sm"
                        >
                            <FaPlus className="mr-2" /> Add Hardware
                        </button>
                        <button
                            onClick={exportToExcel}
                            // Secondary Green Button Style (consistent action coloring)
                            className="px-6 py-2 rounded-xl bg-green-600 text-white font-semibold flex items-center hover:bg-green-700 transition-all duration-300 shadow-lg shadow-green-300/50 text-sm"
                        >
                            <FaFileExcel className="mr-2" /> Export Data
                        </button>
                    </div>
                </header>

                <MessageComponent message={message} type={messageType} />

                {/* Filters Card (Admin-style card) */}
                <div className="bg-white p-4 rounded-xl shadow-xl mb-6 border border-gray-100">
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-700"><FaFilter className="mr-2 text-base text-indigo-600" /> Quick Filters</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                        <FormInput type="text" name="name" placeholder="Hardware Name" label="Item Name" value={filters.name} onChange={handleFilterChange} />
                        <FormInput type="text" name="serialNo" placeholder="Serial No." label="Serial Number" value={filters.serialNo} onChange={handleFilterChange} />
                        <FormInput type="text" name="company" placeholder="Company Name" label="Vendor Company" value={filters.company} onChange={handleFilterChange} />
                        <FormInput label="Court Station" name="court" value={filters.court} onChange={handleFilterChange}>
                            <select value={filters.court} name="court" onChange={handleFilterChange} 
                                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm appearance-none bg-white h-[47px]"
                            >
                                <option value="">All Court Names</option>
                                {COURT_STATIONS.map((court) => (<option key={court} value={court}>{court}</option>))}
                            </select>
                        </FormInput>
                    </div>
                </div>

                {/* Table Component */}
                <div className="bg-white p-6 rounded-xl shadow-xl">
                    <HardwareList 
                        filteredHardware={filteredHardware}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                        handleShow={handleShow}
                    />
                </div>

                {/* CREATE/EDIT MODAL POPUP (Uses Admin modal design principles) */}
                {showModal && (
                    <HardwareModal
                        formData={formData}
                        handleMainFormChange={handleMainFormChange}
                        handleHardwareItemChange={handleHardwareItemChange}
                        addHardwareItem={addHardwareItem}
                        removeHardwareItem={removeHardwareItem}
                        handleSubmitHardware={handleSubmitHardware}
                        serialErrors={serialErrors}
                        onClose={() => {
                            setShowModal(false);
                            setFormData(initialFormData); 
                        }}
                    />
                )}

                {/* INFO/SHOW MODAL POPUP (Uses the designed InfoModal) */}
                {showInfoModal && (
                    <InfoModal
                        record={editingRecord}
                        onClose={() => setShowInfoModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

export default UserDashboard;