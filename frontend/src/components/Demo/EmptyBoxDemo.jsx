import EmptyBox from '../Common/EmptyBox';

const EmptyBoxDemo = () => {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold text-center">EmptyBox Component Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Default Size (120px)</h3>
          <EmptyBox message="No data available" />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Small Size (80px)</h3>
          <EmptyBox message="No transactions found" size={80} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Large Size (150px)</h3>
          <EmptyBox message="No invoices available" size={150} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Custom Styling</h3>
          <EmptyBox 
            message="No support tickets found" 
            size={100} 
            className="bg-gray-50 rounded-lg" 
          />
        </div>
      </div>
    </div>
  );
};

export default EmptyBoxDemo;