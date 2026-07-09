import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldAlert, EyeOff } from 'lucide-react';

interface SecurityWrapperProps {
  children: React.ReactNode;
}

export function SecurityWrapper({ children }: SecurityWrapperProps) {
  // DRM Desativado temporariamente
  return <>{children}</>;
}
