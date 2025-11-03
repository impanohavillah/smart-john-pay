import { useState, useEffect } from 'react';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  const requestPermissions = async (): Promise<boolean> => {
    if (!isNative) {
      setError('Geolocation is only available on native platforms');
      return false;
    }

    try {
      const permission = await Geolocation.checkPermissions();
      
      if (permission.location === 'granted') {
        return true;
      }

      const requestResult = await Geolocation.requestPermissions();
      return requestResult.location === 'granted';
    } catch (err) {
      setError('Failed to request location permissions');
      return false;
    }
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    setLoading(true);
    setError(null);

    try {
      const hasPermission = await requestPermissions();
      
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const position: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      };

      setLocation(locationData);
      return locationData;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get location';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    location,
    error,
    loading,
    isNative,
    getCurrentLocation,
    requestPermissions
  };
};
