import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { 
    FaPlus, FaSignOutAlt, FaFilter, FaFileExcel, FaHome, FaUserCircle, 
    FaTimesCircle, FaDesktop, FaBuilding, FaUserTie, FaCalendarAlt, FaTrashAlt, FaInfoCircle
} from 'react-icons/fa';
import { MdOutlineSecurity, MdNumbers, MdAddBox } from 'react-icons/md';

// Assuming these components are in the same folder or path
import HardwareModal from './HardwareModal'; 
import HardwareList from './HardwareList'; 

// --- Constants ---
export const HARDWARE_OPTIONS = [
    'CPU', 'Monitor', 'Keyboard', 'Mouse', 'LCD', 'Scanner', 'Printer', 'Other'
];

export const COURT_STATIONS = [
    "Malegaon Court", "Manmad Court", "Nashik City Court", "Niphad Court",
    "Igatpuri Court", "Sinnar Court", "Yeola Court", "Nandgaon Court"
];

// --- Utility Components (Included for completeness) ---

const MessageComponent = ({ message, type }) => {
    if (!message) return null;
    const baseClasses = "py-3 px-6 rounded-xl font-medium text-white mb-3 transition-all duration-300 transform animate-fade-in flex items-center shadow-lg"; 
    const typeClasses = type === "success" ? "bg-green-500" : "bg-red-500";
    const Icon = type === "success" ? FaDesktop : FaTimesCircle;
    return (
        <div className={`${baseClasses} ${typeClasses}`}>
            <Icon className="mr-3 text-xl"/>
            {message}
        </div>
    );
};

const FormInput = ({ label, id, name, value, onChange, type = 'text', required = false, error, children, icon: Icon, placeholder }) => (
    <div className="flex flex-col mb-2"> 
        <label htmlFor={id} className="text-xs font-medium text-gray-700 flex items-center mb-0.5"> 
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
                    className={`w-full p-1.5 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md transition-all duration-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm`}
                />
            )}
        </div>
        {error && <p className="text-red-500 text-xs mt-0.5 italic">{error}</p>}
    </div>
);

// --- NEW INFO MODAL COMPONENT (For Show Button) ---
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
            <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] transform transition-all duration-300 scale-100">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h2 className="text-2xl font-extrabold text-blue-700 flex items-center pt-1">
                        <FaInfoCircle className="mr-3 text-xl"/> Hardware Details: <span className="ml-2 text-gray-800 italic">{record.hardwareName}</span>
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-600 transition-colors text-xl p-1 ml-2">
                        <FaTimesCircle />
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
                    {/* Column 1: Metadata */}
                    <div className="bg-blue-50 p-4 rounded-xl shadow-inner border border-blue-200">
                        <h3 className="text-md font-bold text-blue-800 mb-3 border-b border-blue-300 pb-1">General Information</h3>
                        {metadataFields.map((field, index) => (
                            <div key={index} className="flex items-start mb-2 text-sm">
                                <span className="w-1/2 font-semibold text-gray-700 flex items-center">
                                    <field.icon className="mr-2 text-blue-500 text-sm"/> {field.label}:
                                </span>
                                <span className="w-1/2 text-gray-900 font-medium">{field.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Column 2: Hardware Specifics */}
                    <div className="bg-gray-100 p-4 rounded-xl shadow-inner border border-gray-200">
                        <h3 className="text-md font-bold text-gray-800 mb-3 border-b border-gray-300 pb-1 flex items-center">
                            <FaDesktop className="mr-2"/> Hardware Item
                        </h3>
                        <div className="space-y-3">
                            <div className="text-base font-bold text-indigo-700 border-b pb-1">
                                {record.hardwareName}
                            </div>
                            <div className="text-sm">
                                <span className="font-semibold text-gray-700">Serial Number:</span>
                                <span className="ml-2 font-mono text-gray-900">{record.serialNumber}</span>
                            </div>
                            <p className="text-xs text-gray-500 pt-2 border-t mt-3">
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


// --- Main Dashboard Component ---

const UserDashboard = () => {
    
    const [user, setUser] = useState(null);
    const [hardwareRecords, setHardwareRecords] = useState([]); 
    
    // State for the main form data (used for both Create and Edit)
    const initialFormData = {
        _id: null, // Subdocument ID of the item being edited
        parentId: null, // Parent document ID (needed for PUT/DELETE)
        courtName: '', companyName: '', deliveryDate: '', installationDate: '', 
        deadStockRegSrNo: '', deadStockBookPageNo: '', source: '',
        hardwareItems: [{ hardwareName: '', manualHardwareName: '', serialNumber: '' }]
    };
    const [formData, setFormData] = useState(initialFormData);
    
    // State to manage modal visibility and what record is being viewed
    const [showModal, setShowModal] = useState(false); // Used for Create/Edit
    const [showInfoModal, setShowInfoModal] = useState(false); // Used for Show
    const [editingRecord, setEditingRecord] = useState(null); // The full record object for Info/Edit

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
            // This endpoint must return the FLATTENED array including _id (item ID) and parentId
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
                // (Serial number validation logic omitted for brevity)
                return updatedItem;
            }
            return item;
        });

        setFormData({ ...formData, hardwareItems: newItems });
    };
    
    const addHardwareItem = () => {
        setFormData({
            ...formData,
            hardwareItems: [...formData.hardwareItems, { hardwareName: '', manualHardwareName: '', serialNumber: '' }]
        });
    };

    const removeHardwareItem = (index) => {
        // NOTE: In EDIT mode (formData._id exists), removing the item from the form
        // doesn't delete it from the DB. Only DELETE action handles DB removal.
        const newItems = formData.hardwareItems.filter((_, i) => i !== index);
        setFormData({ ...formData, hardwareItems: newItems });
        // (Serial errors cleanup omitted for brevity)
    };

    // Consolidated Submit/Update Handler
    const handleSubmitHardware = async (e) => {
        e.preventDefault();

        // (Basic Validation omitted for brevity)

        try {
            const payload = {
                courtName: formData.courtName,
                companyName: formData.companyName,
                deliveryDate: formData.deliveryDate,
                installationDate: formData.installationDate,
                deadStockRegSrNo: formData.deadStockRegSrNo,
                deadStockBookPageNo: formData.deadStockBookPageNo,
                source: formData.source,
                // Map item data, including the item's _id if in edit mode
                hardwareItems: formData.hardwareItems.map(item => ({
                    // Use item._id for the PUT request to identify the subdocument
                    _id: formData._id ? item._id : undefined, 
                    hardwareName: item.hardwareName === 'Other' ? item.manualHardwareName : item.hardwareName,
                    serialNumber: item.serialNumber,
                }))
            };

            if (formData._id && formData.parentId) {
                // *** EDIT LOGIC (PUT request) ***
                // Uses the PARENT ID in the URL, sends the item's _id in the payload
                await axios.put(`${backend_Url}/api/user/hardware/${formData.parentId}`, payload, config);
                showMessage(`Hardware record ID ${formData._id} updated successfully! ✅`, 'success');
            } else {
                // *** CREATE LOGIC (POST request) ***
                await axios.post(backend_Url + '/api/user/hardware', payload, config); 
                showMessage('Hardware records created successfully! 🎉', 'success');
            }
            
            // Reset form data and close modal
            setFormData(initialFormData);
            setShowModal(false);
            fetchHardwareRecords(); // Refresh the list
        } catch (err) {
            const errMsg = err.response?.data?.msg || 'Operation failed. Check server logs.';
            showMessage(errMsg, 'error');
        }
    };


    // --- ACTION HANDLERS (Edit, Delete, Show) ---

    // 1. EDIT FUNCTIONALITY (Accepts item ID and parent ID)
    const handleEdit = (id, parentId) => {
        // Find the full item object from the flattened list using its _id (item ID)
        const recordToEdit = hardwareRecords.find(h => h._id === id);
        
        if (recordToEdit) {
            // Transform the single hardware item back into the form structure
            const item = {
                // Determine if it was an 'Other' type
                hardwareName: HARDWARE_OPTIONS.includes(recordToEdit.hardwareName) ? recordToEdit.hardwareName : 'Other',
                manualHardwareName: HARDWARE_OPTIONS.includes(recordToEdit.hardwareName) ? '' : recordToEdit.hardwareName,
                serialNumber: recordToEdit.serialNumber,
                _id: recordToEdit._id // IMPORTANT: The subdocument ID
            };

            setFormData({
                _id: recordToEdit._id, // Set the item ID
                parentId: recordToEdit.parentId, // Set the Parent ID
                courtName: recordToEdit.courtName,
                companyName: recordToEdit.companyName,
                deliveryDate: recordToEdit.deliveryDate.split('T')[0], // format date for input
                installationDate: recordToEdit.installationDate.split('T')[0], // format date for input
                deadStockRegSrNo: recordToEdit.deadStockRegSrNo || '',
                deadStockBookPageNo: recordToEdit.deadStockBookPageNo || '',
                source: recordToEdit.source,
                hardwareItems: [item] // Only one item array for single-item edit mode
            });
            setShowModal(true); // Open the main HardwareModal
        } else {
            showMessage(`Record ID ${id} not found locally.`, 'error');
        }
    };

    // 2. DELETE FUNCTIONALITY (Accepts item ID and parent ID)
  // In UserDashboard.jsx

// In UserDashboard.jsx

// 2. DELETE FUNCTIONALITY (Accepts item ID and parent ID)
// 2. DELETE FUNCTIONALITY (Accepts item ID and parent ID)
const handleDelete = async (id, parentId) => {
    if (!id || !parentId) {
        showMessage("Error: Missing Item ID or Parent ID for deletion.", 'error');
        return;
    }

    if (window.confirm(`Are you sure you want to permanently delete hardware item ID ${id} from record ${parentId}?`)) {
        try {
            const backend_Url = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
            
            // 1. API Call for Deletion
            await axios.delete(`${backend_Url}/api/user/hardware/${parentId}/${id}`, config);
            
            // 2. SET SUCCESS MESSAGE STATE FIRST (Displays the message)
            await showMessage(`Hardware item ID: ${id} deleted successfully. 🗑️`, 'success');
            
            // 3. REFRESH THE DATA LIST FROM THE SERVER (Removes record from table)
            // Await ensures the component re-renders ONLY after fetching the new data.
            await fetchHardwareRecords();
            
        } catch (err) {
            
            // 4. ERROR MESSAGE CALL ON FAILURE
            const errMsg = err.response?.data?.msg || 'Failed to delete record. Check API path or server logs.';
            showMessage(errMsg, 'error');
            
            // 5. REFRESH THE DATA LIST (CRITICAL FIX)
            // If the deletion failed (e.g., 404 or 500), we must refresh the list 
            // to ensure the item stays in the table in case it was briefly removed 
            // by a speculative local state change.
            // We await the fetch to correctly synchronize the state after the error is displayed.
            await fetchHardwareRecords();
        }
    }
};

    // 3. SHOW INFO FUNCTIONALITY
    const handleShow = (id) => {
        // Find the full item object from the flattened list
        const record = hardwareRecords.find(h => h._id === id);
        if (record) {
            setEditingRecord(record);
            setShowInfoModal(true); // Open the new InfoModal
        } else {
            showMessage(`Record ID ${id} not found.`, 'error');
        }
    };
    
    // --- Table Filtering & Export (Omitted for brevity) ---

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

    const exportToExcel = () => { /* ... export logic ... */ };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    // --- Render ---

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans text-gray-800">
            
            {/* ... Sidebar and Header content (omitted) ... */}
            <div className="flex-1 p-4 sm:p-8 lg:p-10">
                
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 pb-2 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">Hardware Inventory</h1>
                        <p className="text-gray-500 mt-0 text-xs">Manage and view all hardware assets allocated to this area.</p>
                    </div>
                    
                    <div className="flex space-x-3 mt-2 md:mt-0">
                        <button
                            onClick={() => {
                                setFormData(initialFormData); // Reset form data to create a new record
                                setShowModal(true);
                            }}
                            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold flex items-center hover:bg-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-300/50 text-sm"
                        >
                            <FaPlus className="mr-2" /> Add Hardware
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="px-5 py-2 rounded-xl bg-green-600 text-white font-semibold flex items-center hover:bg-green-700 transition-all duration-300 shadow-lg shadow-green-300/50 text-sm"
                        >
                            <FaFileExcel className="mr-2" /> Export
                        </button>
                    </div>
                </header>

                <MessageComponent message={message} type={messageType} />

                {/* Filters (omitted) */}
                <div className="bg-white p-2 rounded-xl shadow-xl mb-3 border border-gray-100">
                    <h3 className="text-sm font-semibold mb-1 flex items-center text-gray-700"><FaFilter className="mr-2 text-sm text-indigo-600" /> Quick Filters</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-2">
                        <FormInput type="text" name="name" placeholder="Hardware Name" value={filters.name} onChange={handleFilterChange} />
                        <FormInput type="text" name="serialNo" placeholder="Serial No." value={filters.serialNo} onChange={handleFilterChange} />
                        <FormInput type="text" name="company" placeholder="Company Name" value={filters.company} onChange={handleFilterChange} />
                        <select value={filters.court} name="court" onChange={handleFilterChange} className="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner appearance-none bg-white h-[41.5px]">
                            <option value="">All Court Names</option>
                            {COURT_STATIONS.map((court) => (<option key={court} value={court}>{court}</option>))}
                        </select>
                    </div>
                </div>

                {/* Table Component */}
                <HardwareList 
                    filteredHardware={filteredHardware}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleShow={handleShow}
                />

                {/* CREATE/EDIT MODAL POPUP */}
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
                            setFormData(initialFormData); // Clear form state on close
                        }}
                    />
                )}

                {/* INFO/SHOW MODAL POPUP */}
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