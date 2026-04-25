function CreateOrderForm({ form, onChange, onSubmit, isSubmitting, result, statusOptions, riders, isRidersLoading }) {
  return (
    <div>
      <form onSubmit={onSubmit} className='admin-form'>
        <input name='trackingId' placeholder='Tracking ID (MX00001)' value={form.trackingId} onChange={onChange} required />
        <input name='sender.name' placeholder='Sender name' value={form.sender.name} onChange={onChange} required />
        <input name='sender.phone' placeholder='Sender phone' value={form.sender.phone} onChange={onChange} required />
        <input name='sender.address' placeholder='Sender address' value={form.sender.address} onChange={onChange} required />
        <input name='receiver.name' placeholder='Receiver name' value={form.receiver.name} onChange={onChange} required />
        <input name='receiver.phone' placeholder='Receiver phone' value={form.receiver.phone} onChange={onChange} required />
        <input name='receiver.address' placeholder='Receiver address' value={form.receiver.address} onChange={onChange} required />
        <input name='receiver.location.lat' placeholder='Receiver latitude (optional)' value={form.receiver.location.lat} onChange={onChange} />
        <input name='receiver.location.lng' placeholder='Receiver longitude (optional)' value={form.receiver.location.lng} onChange={onChange} />
        <input name='package.description' placeholder='Package description' value={form.package.description} onChange={onChange} required />
        <select name='delivery.status' value={form.delivery.status} onChange={onChange}>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>

        <select name='rider.riderId' value={form.rider.riderId} onChange={onChange}>
          <option value=''>Assign Rider (optional)</option>
          {riders.map((rider) => (
            <option key={rider.id} value={rider.id}>
              {rider.name} ({rider.phone})
            </option>
          ))}
        </select>
        <input name='rider.name' placeholder='Rider name' value={form.rider.name} onChange={onChange} readOnly={Boolean(form.rider.riderId)} />
        <input name='rider.phone' placeholder='Rider phone' value={form.rider.phone} onChange={onChange} readOnly={Boolean(form.rider.riderId)} />
        <input name='rider.currentLocation' placeholder='Auto-filled rider location' value={form.rider.currentLocation} onChange={onChange} readOnly />
        {isRidersLoading ? <p className='admin-result'>Loading riders...</p> : null}
        <button type='submit' disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Order'}</button>
      </form>
      {result && <p className='admin-result'>{result}</p>}
    </div>
  )
}

export default CreateOrderForm