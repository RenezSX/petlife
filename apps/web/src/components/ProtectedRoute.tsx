import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

export function ProtectedRoute({children,roles}:{children:ReactNode;roles?:User['role'][]}){
  const{user,loading}=useAuth();
  const location=useLocation();

  if(loading)return <div className="screen-center"><div className="auth-loading">Carregando PetLife...</div></div>;
  if(!user)return <Navigate to="/login" replace state={{from:location.pathname}}/>;
  if(roles&&!roles.includes(user.role))return <Navigate to="/dashboard" replace/>;
  return <>{children}</>;
}
