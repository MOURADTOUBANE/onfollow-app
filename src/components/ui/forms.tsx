'use client';
import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../graphics/Icon';
import type { IconName } from '../graphics/icon-data';
import { FieldError } from './atoms';

/** Label + control + inline error. The error is only visible when `error` is set (CSS: .field.bad .err). */
export function Field({ id, label, error, optional, children }: { id: string; label: string; error?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div className={`field${error ? ' bad' : ''}`}>
      <label htmlFor={id}>{label}{optional && <small>Optional</small>}</label>
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}

/** Input with a leading icon inside the rounded control. */
export function IconInput({ icon, ...rest }: { icon: IconName } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="ctl">
      <Icon name={icon} size={20} />
      <input {...rest} />
    </div>
  );
}

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="ctl">
      <Icon name="lock" size={20} />
      <input {...props} type={show ? 'text' : 'password'} />
      <button type="button" className="btn-icon" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        <Icon name={show ? 'eyeOff' : 'eye'} size={20} />
      </button>
    </div>
  );
}
