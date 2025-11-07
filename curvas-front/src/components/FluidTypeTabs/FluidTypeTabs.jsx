import "./FluidTypeTabs.css";

const FLUID_TYPES = [
  { id: 'oil', label: 'Petróleo', color: '#2bcc2b' },
  { id: 'gas', label: 'Gas', color: '#888' },
  { id: 'water', label: 'Agua', color: '#FFaaaa' }
];

export default function FluidTypeTabs({ selectedType, onSelect }) {
  return (
    <div className="fluid-type-tabs">
      {FLUID_TYPES.map((type) => (
        <button
          key={type.id}
          className={`fluid-tab ${selectedType === type.id ? 'active' : ''}`}
          onClick={() => onSelect(type.id)}
          style={{
            borderBottomColor: selectedType === type.id ? type.color : 'transparent',
            color: selectedType === type.id ? type.color : '#666'
          }}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}
