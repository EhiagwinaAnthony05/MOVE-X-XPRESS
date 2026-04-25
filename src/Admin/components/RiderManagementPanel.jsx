function RiderManagementPanel({
  riders,
  isLoading,
  form,
  onChange,
  onSubmit,
  onDelete,
  deletingRiderId,
  isSubmitting,
  result,
}) {
  return (
    <div>
      <form onSubmit={onSubmit} className='admin-form'>
        <input name='name' placeholder='Rider name' value={form.name} onChange={onChange} required />
        <input name='phone' placeholder='Rider phone number' value={form.phone} onChange={onChange} required />
        <button type='submit' disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Create/Refresh Rider'}</button>
      </form>

      {result ? <p className='admin-result'>{result}</p> : null}

      <div className='admin-rider-list'>
        <h4>Registered Riders</h4>
        {isLoading ? <p className='admin-result'>Loading riders...</p> : null}
        {!isLoading && riders.length === 0 ? <p className='admin-result'>No riders yet.</p> : null}
        {riders.map((rider) => (
          <article key={rider.id} className='admin-rider-item'>
            <p><strong>{rider.name}</strong> ({rider.phone})</p>
            <p>Status: {rider.isSharing ? 'Sharing live location' : 'Offline'}</p>
            <p>Last location: {rider.lastLocation?.placeName || 'No location yet'}</p>
            <button
              type='button'
              className='admin-delete-rider-btn'
              disabled={deletingRiderId === rider.id}
              onClick={() => onDelete(rider.id, rider.name)}
            >
              {deletingRiderId === rider.id ? 'Deleting...' : 'Delete Rider'}
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}

export default RiderManagementPanel
