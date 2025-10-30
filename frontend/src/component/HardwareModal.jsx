import React, { useState, useCallback, useMemo } from 'react';
import { FaPlus, FaTimesCircle, FaDesktop, FaTrashAlt, FaTag, FaCheckCircle, FaClipboardList, FaBuilding, FaUserTie, FaCalendarAlt, FaTrashRestore } from 'react-icons/fa';
import { MdNumbers, MdAddBox, MdFactory, MdOutlineSettings, MdSecurity } from 'react-icons/md';

// --- Constants (Simplified for the component) ---
// NOTE: Ensure COURT_STATIONS is correctly defined in your environment or main file.
const rawStations = process.env.REACT_APP_COURT_STATIONS || '';
const court_List = rawStations
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
const COURT_STATIONS = process.env.COURT_STATIONS ? process.env.COURT_STATIONS.split(',').map(s => s.trim()).filter(s => s.length > 0) : court_List;
const HARDWARE_OPTIONS = ['CPU', 'Monitor', 'Keyboard', 'Mouse', 'LCD', 'Scanner', 'Printer', 'ALL IN ONE PC','Other'];
const MANUFACTURER_OPTIONS = ["DELL", "HP", "SAMSUNG", "LENOVO","CANON","KYOCERA"];
const SOURCE_OPTIONS = ["HIGHCOURT", "ECOURT PROJECT", "District Judge Office"];

// --- Utility Components (Space-Reduced) ---

// Custom Form Input with compact design
const FormInput = ({ label, id, name, value, onChange, type = 'text', required = false, error, children, icon: Icon, placeholder }) => (
    // Reduced mb-4 to mb-3 for less vertical space
    <div className="flex flex-col mb-3"> 
        {/* Reduced label size and margin */}
        <label htmlFor={id} className="text-xs font-bold text-gray-700 flex items-center mb-0.5"> 
            {Icon && <Icon className="mr-1 text-indigo-600 text-sm" />}
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
                    // Reduced padding (p-2) and text size (text-sm) for compact look
                    className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md transition-all duration-150 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm`}
                />
            )}
        </div>
        {error && <p className="text-red-500 text-xs mt-0.5 italic">{error}</p>}
    </div>
);

// Manufacturer Selector (Compact design)
const ManufacturerSelector = React.memo(({ index, value, onChange, required }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const handleManufacturerChange = (e) => { onChange(index, e); setShowSuggestions(true); };
    const selectManufacturer = useCallback((manufacturer) => {
        const syntheticEvent = { target: { name: 'company', value: manufacturer } };
        onChange(index, syntheticEvent);
        setShowSuggestions(false);
    }, [index, onChange]);

    return (
        <div className="flex flex-col mb-3"> 
            <label htmlFor={`company-${index}`} className="text-xs font-bold text-gray-700 flex items-center mb-0.5"> 
                <MdFactory className="mr-1 text-indigo-600 text-sm" />
                Company/Manufacturer {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="relative">
                <input 
                    type="text" 
                    id={`company-${index}`} 
                    name="company" 
                    value={value || ''} 
                    onChange={handleManufacturerChange}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} 
                    required={required}
                    placeholder="Select or type..."
                    className="w-full p-2 border border-gray-300 rounded-md transition-all duration-150 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                    autoComplete="off"
                    list="manufacturer-suggestions-list"
                />
                <datalist id="manufacturer-suggestions-list">
                    {MANUFACTURER_OPTIONS.map(option => <option key={option} value={option} />)}
                </datalist>
            </div>
        </div>
    );
});


// Form for a single hardware item (Optimized Grid)
const FormMultiItem = ({ index, item, onChange, onRemove, serialErrors }) => {
    const isOther = item.hardwareName === 'Other';
    
    return (
        // Reduced padding (p-4) and margin (mb-3)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 mb-3 items-start bg-white rounded-lg shadow-md border border-gray-300 relative">
            
            {/* Asset tag is smaller */}
            <div className="absolute top-0 left-0 px-2 py-1 text-xs font-bold text-blue-800 bg-blue-100 rounded-br-lg rounded-tl-md border-b border-r border-blue-300">
                ASSET #{index + 1}
            </div>

            {/* Hardware Name Selector */}
            <div className="col-span-1 lg:col-span-1 mt-4 lg:mt-0">
                <FormInput label="Type" id={`hardwareType-${index}`} required icon={FaTag}>
                    <select
                        name="hardwareName"
                        value={item.hardwareName}
                        onChange={(e) => onChange(index, e)}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm appearance-none bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Select Type</option>
                        {HARDWARE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                </FormInput>
            </div>

            {/* Manual Hardware Name Input */}
            {isOther && (
                <div className="col-span-1">
                    <FormInput label="Specify" id={`manualName-${index}`} name="manualHardwareName" value={item.manualHardwareName || ''} onChange={(e) => onChange(index, e)} required={isOther} icon={FaDesktop} />
                </div>
            )}
            
            {/* Serial Number Input */}
            <div className={`col-span-1 ${isOther ? '' : 'lg:col-span-2'} `}>
                <FormInput label="Serial No." id={`serialNumber-${index}`} name="serialNumber" value={item.serialNumber || ''} onChange={(e) => onChange(index, e)} required error={serialErrors[index]} icon={MdNumbers} />
            </div>
            
            {/* Company/Manufacturer Input */}
            <div className="col-span-1">
                <ManufacturerSelector index={index} value={item.company} onChange={onChange} required={true} />
            </div>

            {/* Remove Button (Smaller) */}
            <button
                type="button"
                onClick={() => onRemove(index)}
                className="p-2 w-full lg:w-auto bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition-colors flex items-center justify-center text-sm mt-auto"
                title="Remove Item"
            >
                <FaTrashAlt className="mr-1 text-xs" /> Remove
            </button>
        </div>
    );
};

// --- MERGED & FINALIZED COMPONENT ---

const HardwareDetails = ({ user,
    formData, 
    handleMainFormChange, 
    handleHardwareItemChange, 
    addHardwareItem, 
    removeHardwareItem, 
    handleSubmitHardware,
    serialErrors,
    onClose 
}) => {
    
    // Core Metadata Logic
    const courtNameValue = formData.courtName || user?.village || "";
    const isFieldDisabled = !!user?.village; 

    useState(() => {
        if (isFieldDisabled && courtNameValue && formData.courtName !== courtNameValue) {
            handleMainFormChange({ target: { name: 'courtName', value: courtNameValue } });
        }
    }, [user, formData.courtName, isFieldDisabled, courtNameValue, handleMainFormChange]);

    // Check submission readiness
    const isMetadataComplete = formData.courtName && formData.source 
    // && formData.deliveryDate && formData.installationDate;
    const hasHardwareErrors = Object.keys(serialErrors).length > 0;

    return (
        // *** Main container is now fixed to reduce form size and prevent scroll ***
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-2">
            
            {/* Reduced max-w-7xl to max-w-6xl for narrower form */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[98vh] transform transition-all duration-300 flex flex-col border-4 border-gray-100"> 
                
                {/* Modal Header */}
                <div className="p-4 sticky top-0 bg-blue-700 text-white rounded-t-lg z-20 shadow-md">
                    <div className="flex justify-between items-start">
                        {/* Form Name: Hardware Details */}
                        <h2 className="text-xl font-extrabold flex items-center">
                            <FaClipboardList className="mr-2 text-lg"/> Hardware Details Form
                        </h2>
                        
                        <button onClick={onClose} className="text-blue-200 hover:text-white transition-colors text-xl p-1 rounded-full hover:bg-blue-600">
                            <FaTimesCircle />
                        </button>
                    </div>
                </div>

                {/* Form Body - SCROLLS ONLY IF NECESSARY (max-h is controlled by parent) */}
                <form 
                    onSubmit={handleSubmitHardware} 
                    id="hardwareForm" 
                    // Reduced padding (p-4) and spacing (space-y-6)
                    className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50"
                >
                    {/* SECTION 1: CORE METADATA (Compact Grid) */}
                    {/* Reduced padding (p-4) and border-t-2 */}
                    <div className="bg-white p-4 rounded-lg shadow-lg border-t-2 border-blue-500">
                        {/* Reduced heading size and margin */}
                        <h3 className="text-lg font-extrabold text-blue-800 mb-4 pb-2 border-b-2 border-gray-200 flex items-center">
                            <MdOutlineSettings className="mr-2 text-xl text-blue-500"/> 1. General Record Metadata
                        </h3>
                        
                        {/* Increased grid density to 4 columns */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2">
                            
                            {/* Court Name Selector (Integrated) */}
                            <FormInput label="Court Name" id="courtName" name="courtName" value={courtNameValue} onChange={handleMainFormChange} required icon={FaBuilding}>
                                <select 
                                    id="courtName" name="courtName" value={courtNameValue} 
                                    onChange={isFieldDisabled ? undefined : handleMainFormChange} required disabled={isFieldDisabled} 
                                    className={`w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm appearance-none ${isFieldDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500'}`}
                                >
                                    {isFieldDisabled ? (<option value={courtNameValue}>{courtNameValue}</option>) : (
                                        <>
                                            <option value="">Select Court *</option>
                                            {COURT_STATIONS.map((court) => <option key={court} value={court}>{court}</option>)}
                                        </>
                                    )}
                                </select>
                            </FormInput>
                            
                            {/* Source */}
                            <FormInput label="Source" id="source" name="source" value={formData.source} onChange={handleMainFormChange} required icon={FaUserTie}>
                                <input type="text" id="source" name="source" value={formData.source} onChange={handleMainFormChange} required list="source-suggestions" placeholder="e.g., HIGHCOURT" className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" />
                                <datalist id="source-suggestions">{SOURCE_OPTIONS.map(option => <option key={option} value={option} />)}</datalist>
                            </FormInput>

                            {/* Delivery Date */}
                            <FormInput label="Delivery Date" id="deliveryDate" name="deliveryDate" value={formData.deliveryDate} onChange={handleMainFormChange} type="date"  icon={FaCalendarAlt}/>
                            
                            {/* Installation Date */}
                            <FormInput label="Install Date" id="installationDate" name="installationDate" value={formData.installationDate} onChange={handleMainFormChange} type="date"  icon={FaCalendarAlt}/>
                            
                            {/* Company Name */}
                            <FormInput label="Vendor Company" id="companyName" name="companyName" value={formData.companyName} onChange={handleMainFormChange} icon={FaBuilding} placeholder="e.g., CMS Computers"/>
                            
                            {/* Employee Allocated */}
                            <FormInput label="Employee (Optional)" id="employeeAllocated" name="employeeAllocated" value={formData.employeeAllocated} onChange={handleMainFormChange} icon={FaUserTie} placeholder="Full Name or ID"/>
                            
                            {/* Dead Stock Register Sr. No. */}
                            <FormInput label="Dead Stock Sr. No." id="deadStockRegSrNo" name="deadStockRegSrNo" value={formData.deadStockRegSrNo} onChange={handleMainFormChange} icon={MdSecurity}/>
                            
                            {/* Dead Stock Book Page No. */}
                            <FormInput label="Dead Stock Page No." id="deadStockBookPageNo" name="deadStockBookPageNo" value={formData.deadStockBookPageNo} onChange={handleMainFormChange} icon={MdNumbers}/>
                        </div>
                    </div>
                    
                    {/* SECTION 2: DYNAMIC HARDWARE ITEMS */}
                    {/* Reduced padding (p-4) and border-t-2 */}
                    <div className="bg-gray-100 p-4 rounded-lg shadow-lg border-t-2 border-indigo-500">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b-2 border-gray-300">
                            {/* Reduced heading size */}
                            <h3 className="text-lg font-extrabold text-indigo-800 flex items-center">
                                <MdAddBox className="mr-2 text-xl text-indigo-500"/> 2. Asset Details
                            </h3>
                            <button
                                type="button"
                                onClick={addHardwareItem}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition-colors flex items-center shadow-md"
                            >
                                <FaPlus className="mr-1 text-xs"/> Add Asset
                            </button>
                        </div>
                        
                        {formData.hardwareItems.length === 0 && (
                            <div className="p-4 text-center text-gray-600 italic border-2 border-dashed border-gray-300 rounded-lg bg-white">
                                <p className="text-sm font-medium">Click "Add Asset" to start entry.</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {formData.hardwareItems.map((item, index) => (
                                <FormMultiItem
                                    key={index}
                                    index={index}
                                    item={item}
                                    onChange={handleHardwareItemChange}
                                    onRemove={removeHardwareItem}
                                    serialErrors={serialErrors}
                                />
                            ))}
                        </div>
                    </div>
                </form>

                {/* Modal Footer (Action Bar) */}
                <div className="p-3 bg-white border-t border-gray-200 sticky bottom-0 rounded-b-lg z-20 flex justify-end space-x-3 shadow-top-md">
                     <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-colors shadow-sm text-sm border border-gray-400"
                    >
                        Close
                    </button>
                    <button 
                        type="submit" 
                        form="hardwareForm"
                        disabled={!isMetadataComplete || hasHardwareErrors || formData.hardwareItems.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg text-sm disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center"
                    >
                        <FaCheckCircle className="inline mr-2 text-xs"/> SUBMIT
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HardwareDetails;
