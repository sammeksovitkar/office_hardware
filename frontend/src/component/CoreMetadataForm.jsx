import React, { useEffect } from 'react'; 
import { FaBuilding, FaUserTie, FaCalendarAlt } from 'react-icons/fa';
import { MdOutlineSecurity, MdNumbers } from 'react-icons/md';

// Placeholder for FormInput (unchanged)
const FormInput = ({ label, id, name, value, onChange, type = 'text', required = false, error, children, icon: Icon }) => (
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
                    className={`w-full p-1.5 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md transition-all duration-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm`}
                />
            )}
        </div>
        {error && <p className="text-red-500 text-xs mt-0.5 italic">{error}</p>}
    </div>
);

const COURT_STATIONS = [
    "Malegaon", "Nandgaon", "Satana", "Niphad", "Yeola", "Chandwad", "Pimpalgaon (B)", 
    "Manmad City", "Manmad (Rly)", "Sinnar", "Dindori", "Kalwan", "Nashik-Road",
    "Vehicle Section", "Malegaon Sessions Division", "Niphad Sessions Division", 
    "Nashik Dist Court"
];

// New constant for Source suggestions
const SOURCE_OPTIONS = [
    "HIGHCOURT", 
    "ECOURT PROJECT", 
    "District Judge Office", 
    "Other Department"
];


const CoreMetadataForm = ({ formData, handleMainFormChange, user }) => {
    
    // ... Court Name Logic (Unchanged)
    const courtNameValue = formData.courtName || user?.village || "";
    const isFieldDisabled = !!user?.village; 

    useEffect(() => {
        if (isFieldDisabled && courtNameValue && formData.courtName !== courtNameValue) {
            const syntheticEvent = {
                target: {
                    name: 'courtName',
                    value: courtNameValue
                }
            };
            handleMainFormChange(syntheticEvent);
        }
    }, [user, formData.courtName, isFieldDisabled, courtNameValue, handleMainFormChange]);
    
    return (
        <div className="bg-indigo-50 p-4 rounded-xl shadow-inner border border-indigo-200 order-2 lg:order-1">
            <h3 className="text-md font-bold text-indigo-800 mb-3 border-b border-indigo-300 pb-1 flex items-center">
                <FaBuilding className="mr-2"/> Core Metadata
            </h3>
            <div className="space-y-1"> 
                
                {/* Court Name Selector (Unchanged) */}
                <FormInput 
                    label="Court Name" 
                    id="courtName" 
                    name="courtName" 
                    value={courtNameValue} 
                    onChange={handleMainFormChange} 
                    required 
                    icon={FaBuilding}
                >
                    <select 
                        id="courtName" 
                        name="courtName" 
                        value={courtNameValue} 
                        onChange={isFieldDisabled ? undefined : handleMainFormChange} 
                        required 
                        disabled={isFieldDisabled} 
                        className={`w-full p-1.5 border border-gray-300 rounded-md transition-all duration-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm appearance-none ${isFieldDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                    >
                        {isFieldDisabled ? (
                            <option value={courtNameValue}>{courtNameValue}</option>
                        ) : (
                            <>
                                <option value="">Select Court Name *</option>
                                {COURT_STATIONS.map((court) => <option key={court} value={court}>{court}</option>)}
                            </>
                        )}
                    </select>
                    {isFieldDisabled && (
                         <div className="text-xs text-indigo-600 font-semibold mt-1">
                            ✅ **Auto-set to your location.** (Cannot be changed)
                         </div>
                    )}
                </FormInput>
                
                {/* Source (RE-STRUCTURED FOR DATALIST RELIABILITY) */}
                <div className="flex flex-col mb-2"> 
                    <label htmlFor="source" className="text-xs font-medium text-gray-700 flex items-center mb-0.5"> 
                        <FaUserTie className="mr-2 text-indigo-500 text-sm" />
                        From Whom Did It Come? <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                        <input 
                            type="text" 
                            id="source" 
                            name="source" 
                            value={formData.source} 
                            onChange={handleMainFormChange} 
                            required 
                            // Ensure the list attribute is correct
                            list="source-suggestions" 
                            className="w-full p-1.5 border border-gray-300 rounded-md transition-all duration-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                        />
                        
                        {/* The Datalist provides the suggested options */}
                        <datalist id="source-suggestions">
                            {SOURCE_OPTIONS.map(option => (
                                <option key={option} value={option} />
                            ))}
                        </datalist>
                    </div>
                </div>

                {/* Employee Allocated (Unchanged) */}
                <FormInput 
                    label="Employee Allocated" 
                    id="employeeAllocated" 
                    name="employeeAllocated" 
                    value={formData.employeeAllocated} 
                    onChange={handleMainFormChange} 
                    icon={FaUserTie} 
                />
                
                {/* ... Rest of the form inputs remain unchanged ... */}
                <FormInput label="Delivery Date" id="deliveryDate" name="deliveryDate" value={formData.deliveryDate} onChange={handleMainFormChange} type="date" required icon={FaCalendarAlt}/>
                <FormInput label="Installation Date" id="installationDate" name="installationDate" value={formData.installationDate} onChange={handleMainFormChange} type="date" required icon={FaCalendarAlt}/>
                <FormInput label="Dead Stock Register Sr. No." id="deadStockRegSrNo" name="deadStockRegSrNo" value={formData.deadStockRegSrNo} onChange={handleMainFormChange} icon={MdOutlineSecurity}/>
                <FormInput label="Dead Stock Book Page No." id="deadStockBookPageNo" name="deadStockBookPageNo" value={formData.deadStockBookPageNo} onChange={handleMainFormChange} icon={MdNumbers}/>
            </div>
        </div>
    );
};

export default CoreMetadataForm;
