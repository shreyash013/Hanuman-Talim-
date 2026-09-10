/**
 * Client-side CSV Exporter for Shri Hanuman Talim Mandal Shirol
 * Generates UTF-8 encoded CSV files directly from live database entries.
 */
export async function downloadCsvReport(type = 'income', customFilename = null) {
  const filenameMap = {
    balance_sheet: 'shirol_mandal_balance_sheet.csv',
    financial: 'shirol_mandal_balance_sheet.csv',
    income: 'shirol_mandal_income_transactions.csv',
    expenses: 'shirol_mandal_expense_transactions.csv',
    donors: 'shirol_mandal_donors_list.csv',
    members: 'shirol_mandal_members_list.csv'
  };

  const filename = customFilename || filenameMap[type] || `shirol_mandal_${type}_report.csv`;

  function getStore(key) {
    try {
      const item = localStorage.getItem(`shirol_${key}`);
      return item ? JSON.parse(item) : [];
    } catch {
      return [];
    }
  }

  let csvContent = '\uFEFF'; // UTF-8 BOM for Marathi Excel compatibility

  if (type === 'income') {
    const list = getStore('income');
    csvContent += 'पावती क्र,देणगीदाराचे नाव,मोबाईल,रक्कम (₹),पेमेंट प्रकार,हेतू,संकलक,दिनांक\n';
    list.forEach(i => {
      let colName = i.collector_name || 'अध्यक्ष (Admin)';
      if (colName.includes('सचिन') || colName.includes('मनगूळे')) colName = 'सुमेध गवडे (अध्यक्ष)';
      csvContent += `"${i.receipt_number || ''}","${i.donor_name || ''}","${i.mobile || ''}","${i.amount || 0}","${i.payment_method || ''}","${i.purpose || ''}","${colName}","${i.created_at || ''}"\n`;
    });
  } else if (type === 'expenses') {
    const list = getStore('expenses');
    csvContent += 'खर्च आयडी,तपशील,रक्कम (₹),प्रकार,दिला,नोंदवणारा,दिनांक\n';
    list.forEach(e => {
      csvContent += `"${e.expense_id || ''}","${e.description || ''}","${e.amount || 0}","${e.category || ''}","${e.paid_to || ''}","${e.requested_by_name || ''}","${e.created_at || ''}"\n`;
    });
  } else if (type === 'donors') {
    const list = getStore('donors');
    csvContent += 'देणगीदाराचे नाव,मोबाईल,पत्ता/परिसर,एकूण योगदान (₹),एकूण पावत्या\n';
    list.forEach(d => {
      csvContent += `"${d.name || ''}","${d.mobile || ''}","${d.address || d.area || ''}","${d.total_donated || 0}","${d.donations_count || 1}"\n`;
    });
  } else {
    // Balance Sheet / Master Report
    const income = getStore('income');
    const expenses = getStore('expenses');
    const totalInc = income.reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const totalExp = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    csvContent += 'श्री हनुमान तालीम मंडळ शिरोळ - अधिकृत जमा खर्च ताळेबंद\n';
    csvContent += `एकूण जमा (Total Income),₹ ${totalInc}\n`;
    csvContent += `एकूण मंजूर खर्च (Total Expenses),₹ ${totalExp}\n`;
    csvContent += `अखेरची शिल्लक (Net Balance),₹ ${totalInc - totalExp}\n\n`;
    csvContent += 'जमा रक्कम तपशील:\n';
    csvContent += 'पावती क्र,देणगीदार,मोबाईल,रक्कम (₹),संकलक\n';
    income.forEach(i => {
      let colName = i.collector_name || 'अध्यक्ष (Admin)';
      if (colName.includes('सचिन') || colName.includes('मनगूळे')) colName = 'सुमेध गवडे (अध्यक्ष)';
      csvContent += `"${i.receipt_number || ''}","${i.donor_name || ''}","${i.mobile || ''}","${i.amount || 0}","${colName}"\n`;
    });
  }

  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = window.URL.createObjectURL(csvBlob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.setAttribute('download', filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(downloadUrl);
  return true;
}

export default downloadCsvReport;
