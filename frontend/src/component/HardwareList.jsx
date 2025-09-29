import React from 'react';
import { FaEdit, FaTrashAlt, FaEye } from 'react-icons/fa';

const HardwareList = ({ filteredHardware, handleEdit, handleDelete, handleShow }) => {
    
    // Define the table headers for easy maintenance
    const tableHeaders = [
        "Name", "Court", "Serial No.", "Company", 
        "Allocated Emp.", "Delivery Date", "Install Date", 
        "D.S. Reg Sr.", "D.S. Page No.", "Source", "Actions"
    ];

    return (
        <div className="bg-white rounded-2xl shadow-2xl p-0 border border-gray-100">
            <div 
                className="overflow-x-auto overflow-y-auto rounded-2xl" 
                style={{ maxHeight: "calc(100vh - 300px)" }} 
            > 
                <table className="min-w-full divide-y divide-gray-200 table-auto"> 
                    <thead className="bg-indigo-50 sticky top-0 z-10 shadow-md">
                        <tr>
                            {tableHeaders.map(header => (
                                <th key={header} className="px-3 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {filteredHardware.length > 0 ? (
                            filteredHardware.map(hardware => (
                                <tr key={hardware._id} className="hover:bg-indigo-50 transition-colors duration-200">
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate font-medium max-w-[120px]">{hardware.hardwareName}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[100px]">{hardware.courtName}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 font-mono">{hardware.serialNumber}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[100px]">{hardware.companyName}</td>
                                    <td className="px-3 py-3 text-xs text-indigo-600 truncate max-w-[100px] font-semibold">{hardware.employeeAllocated?.fullName || 'N/A'}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 whitespace-nowrap">{hardware.deliveryDate ? new Date(hardware.deliveryDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 whitespace-nowrap">{hardware.installationDate ? new Date(hardware.installationDate).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[100px]">{hardware.deadStockRegSrNo}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[100px]">{hardware.deadStockBookPageNo}</td>
                                    <td className="px-3 py-3 text-xs text-gray-800 truncate max-w-[120px]">{hardware.source}</td>
                                    
                                    {/* Action Buttons: NOW PASSES BOTH ITEM ID (_id) AND PARENT ID */}
                                    <td className="px-3 py-3 text-sm text-gray-800 whitespace-nowrap">
                                        <div className="flex space-x-2">
                                            {/* SHOW: Uses item ID (_id) only */}
                                            <button 
                                                onClick={() => handleShow(hardware._id)}
                                                className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors rounded-full bg-blue-100"
                                                title="View Details"
                                            >
                                                <FaEye className="text-xs" />
                                            </button>
                                            
                                            {/* EDIT: Uses item ID (_id) and parentId */}
                                            <button 
                                                onClick={() => handleEdit(hardware._id, hardware.parentId)}
                                                className="p-1.5 text-green-600 hover:text-green-800 transition-colors rounded-full bg-green-100"
                                                title="Edit Record"
                                            >
                                                <FaEdit className="text-xs" />
                                            </button>
                                            
                                            {/* DELETE: Uses item ID (_id) and parentId */}
                                            <button 
                                                onClick={() => handleDelete(hardware._id, hardware.parentId)}
                                                className="p-1.5 text-red-600 hover:text-red-800 transition-colors rounded-full bg-red-100"
                                                title="Delete Record"
                                            >
                                                <FaTrashAlt className="text-xs" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={11} className="text-center py-8 text-lg text-gray-500 font-medium">
                                    No hardware records found matching the current filters. 😔
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HardwareList;