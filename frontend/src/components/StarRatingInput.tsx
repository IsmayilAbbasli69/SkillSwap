interface StarRatingInputProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function StarRatingInput({ value, onChange, disabled = false }: StarRatingInputProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-3 text-sm font-bold text-ink">Rating <span className="text-xs text-teal-700">Required</span></legend>
      <div className="flex w-fit gap-1 rounded-2xl bg-amber-50 p-2" aria-label="Choose a rating from 1 to 5 stars">
        {[1, 2, 3, 4, 5].map((rating) => (
          <label key={rating} className="group relative grid size-11 cursor-pointer place-items-center rounded-xl outline-none transition hover:bg-white has-focus-visible:ring-2 has-focus-visible:ring-amber-400">
            <input type="radio" name="rating" value={rating} checked={value === rating} onChange={() => onChange(rating)} className="sr-only" />
            <span aria-hidden="true" className={`text-3xl leading-none transition group-hover:scale-110 ${rating <= value ? 'text-amber-400' : 'text-slate-300'}`}>★</span>
            <span className="sr-only">{rating} {rating === 1 ? 'star' : 'stars'}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
