export default function Time() { const now = new Date();
const formatted = now.toLocaleString('en-GB', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

return(
    <div>
    <h2>{formatted}</h2>
    </div>
);
}