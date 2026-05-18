import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

type AnyProps = React.HTMLAttributes<HTMLElement> & Record<string, any>;

export function BlinkUIProvider({ children }: { children: React.ReactNode; theme?: string; darkMode?: string }) {
  return <>{children}</>;
}

export function Page({ className, children, ...props }: AnyProps) {
  return <main className={cn('min-h-screen bg-background text-foreground', className)} {...props}>{children}</main>;
}

export function PageHeader({ className, children, ...props }: AnyProps) {
  return <header className={cn('px-4 py-4', className)} {...props}>{children}</header>;
}

export function PageBody({ className, children, ...props }: AnyProps) {
  return <div className={cn('px-4', className)} {...props}>{children}</div>;
}

export function PageTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h1 className={cn('text-2xl font-bold tracking-tight', className)} {...props}>{children}</h1>;
}

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)} {...props}>{children}</div>
));
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>{children}</div>
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, children, ...props }, ref) => (
  <h3 ref={ref} className={cn('font-semibold leading-none tracking-tight', className)} {...props}>{children}</h3>
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, children, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}>{children}</p>
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props}>{children}</div>
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props}>{children}</div>
));
CardFooter.displayName = 'CardFooter';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', asChild, children, ...props }, ref) => {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
    variant === 'default' && 'bg-primary text-primary-foreground hover:bg-primary/90',
    variant === 'outline' && 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    variant === 'ghost' && 'hover:bg-accent hover:text-accent-foreground',
    variant === 'secondary' && 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    variant === 'link' && 'text-primary underline-offset-4 hover:underline',
    size === 'default' && 'h-10 px-4 py-2',
    size === 'sm' && 'h-9 rounded-md px-3',
    size === 'lg' && 'h-11 rounded-md px-8',
    size === 'icon' && 'h-10 w-10',
    className
  );

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: cn((children as React.ReactElement<any>).props.className, classes),
      ...props,
    });
  }

  return <button ref={ref} className={classes} {...props}>{children}</button>;
});
Button.displayName = 'Button';

export const Badge = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & { variant?: string }>(({ className, children, variant, ...props }, ref) => (
  <span ref={ref} className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors', variant === 'outline' ? 'border-current bg-transparent' : 'border-transparent bg-primary text-primary-foreground', className)} {...props}>{children}</span>
));
Badge.displayName = 'Badge';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export function Progress({ value = 0, className, ...props }: { value?: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return <div className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)} {...props}><div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>;
}

export function Checkbox({ checked, onCheckedChange, className, ...props }: { checked?: boolean; onCheckedChange?: (checked: boolean) => void; className?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return <input type="checkbox" checked={!!checked} onChange={(e) => onCheckedChange?.(e.target.checked)} className={cn('h-5 w-5 rounded border border-input accent-primary', className)} {...props} />;
}

const TabsContext = createContext<{ value?: string; setValue?: (value: string) => void }>({});

export function Tabs({ value, defaultValue, onValueChange, children, className, ...props }: AnyProps & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void }) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const setValue = (next: string) => {
    setInternal(next);
    onValueChange?.(next);
  };
  return <TabsContext.Provider value={{ value: current, setValue }}><div className={cn('w-full', className)} {...props}>{children}</div></TabsContext.Provider>;
}

export function TabsList({ className, children, ...props }: AnyProps) {
  return <div className={cn('inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground', className)} {...props}>{children}</div>;
}

export function TabsTrigger({ value, className, children, ...props }: AnyProps & { value: string }) {
  const ctx = useContext(TabsContext);
  const active = ctx.value === value;
  return <button type="button" onClick={() => ctx.setValue?.(value)} className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all', active && 'bg-background text-foreground shadow-sm', className)} {...props}>{children}</button>;
}

export function TabsContent({ value, className, children, ...props }: AnyProps & { value: string }) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return <div className={cn('mt-2', className)} {...props}>{children}</div>;
}

const SelectContext = createContext<{ value?: string; onValueChange?: (value: string) => void }>({});

export function Select({ value, defaultValue, onValueChange, children }: { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; children: React.ReactNode }) {
  return <SelectContext.Provider value={{ value: value ?? defaultValue, onValueChange }}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({ className, children, ...props }: AnyProps) {
  return <div className={cn('flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm', className)} {...props}>{children}</div>;
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useContext(SelectContext);
  return <span>{ctx.value || placeholder}</span>;
}

export function SelectContent({ className, children, ...props }: AnyProps) {
  const ctx = useContext(SelectContext);
  const items = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<any>[];
  return (
    <select
      className={cn('mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm', className)}
      value={ctx.value || ''}
      onChange={(e) => ctx.onValueChange?.(e.target.value)}
      {...props}
    >
      {items.map((item, index) => (
        <option key={index} value={item.props.value}>{item.props.children}</option>
      ))}
    </select>
  );
}

export function SelectItem({ children }: { value: string; children: React.ReactNode }) {
  return <>{children}</>;
}

export function Toaster() {
  return null;
}

export const toast = {
  success: (message: string) => console.log(message),
  error: (message: string) => console.error(message),
  info: (message: string) => console.info(message),
};
