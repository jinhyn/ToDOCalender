import { useState, useEffect, useRef, useCallback } from 'react';

const KAKAO_MAP_APP_KEY = '88dbf074f3edb7e6126477fc5a590fc5';

export function useKakaoMap(popupVisible, initialTaskData) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

  const [isMapSdkLoaded, setIsMapSdkLoaded] = useState(false);
  const [currentSelectedLocation, setCurrentSelectedLocation] = useState(null);
  const [currentLocationName, setCurrentLocationName] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const initialLocation = initialTaskData?.location;
  const initialLocationName = initialTaskData?.locationName || '';
  const initialLat = initialLocation?.lat ?? null;
  const initialLng = initialLocation?.lng ?? null;

  useEffect(() => {
    if (initialLat !== null && initialLng !== null) {
      setCurrentSelectedLocation({ lat: initialLat, lng: initialLng });
      setCurrentLocationName(initialLocationName);
    } else {
      setCurrentSelectedLocation(null);
      setCurrentLocationName('');
    }
  }, [initialLat, initialLng, initialLocationName]);

  useEffect(() => {
    if (document.getElementById('kakao-map-sdk')) {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => setIsMapSdkLoaded(true));
      } else {
        const checkKakaoMaps = setInterval(() => {
          if (window.kakao && window.kakao.maps) {
            clearInterval(checkKakaoMaps);
            window.kakao.maps.load(() => setIsMapSdkLoaded(true));
          }
        }, 100);
        return () => clearInterval(checkKakaoMaps);
      }
      return;
    }

    const mapScript = document.createElement('script');
    mapScript.id = 'kakao-map-sdk';
    mapScript.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&libraries=services&autoload=false`;
    mapScript.async = true;
    mapScript.onload = () => {
      window.kakao.maps.load(() => setIsMapSdkLoaded(true));
    };
    mapScript.onerror = () => console.error('카카오 맵 SDK 로드 실패');
    document.body.appendChild(mapScript);
  }, []);

  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.kakao || !window.kakao.maps) return;

    const initialMapCenter = currentSelectedLocation
      ? new window.kakao.maps.LatLng(currentSelectedLocation.lat, currentSelectedLocation.lng)
      : new window.kakao.maps.LatLng(37.566826, 126.9786567);

    mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, {
      center: initialMapCenter,
      level: 3,
    });

    markerInstanceRef.current = new window.kakao.maps.Marker({
      position: initialMapCenter,
    });

    if (currentSelectedLocation) {
      markerInstanceRef.current.setMap(mapInstanceRef.current);
    }
  }, [currentSelectedLocation]);

  useEffect(() => {
    if (popupVisible && isMapSdkLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }

    if (mapInstanceRef.current && currentSelectedLocation) {
      const locPosition = new window.kakao.maps.LatLng(
        currentSelectedLocation.lat,
        currentSelectedLocation.lng,
      );
      mapInstanceRef.current.setCenter(locPosition);
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setPosition(locPosition);
        markerInstanceRef.current.setMap(mapInstanceRef.current);
      }
    } else if (mapInstanceRef.current && !currentSelectedLocation && markerInstanceRef.current) {
      markerInstanceRef.current.setMap(null);
    }
  }, [popupVisible, isMapSdkLoaded, currentSelectedLocation, initializeMap]);

  const searchLocation = useCallback((keyword) => {
    if (!isMapSdkLoaded || !mapInstanceRef.current || !keyword.trim()) {
      alert('지도가 준비되지 않았거나 검색어가 없습니다.');
      return;
    }

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(keyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data);
        const firstResult = data[0];
        const locPosition = new window.kakao.maps.LatLng(firstResult.y, firstResult.x);
        mapInstanceRef.current.setCenter(locPosition);

        if (markerInstanceRef.current) {
          markerInstanceRef.current.setPosition(locPosition);
          markerInstanceRef.current.setMap(mapInstanceRef.current);
        } else {
          markerInstanceRef.current = new window.kakao.maps.Marker({
            map: mapInstanceRef.current,
            position: locPosition,
          });
        }

        setCurrentSelectedLocation({ lat: parseFloat(firstResult.y), lng: parseFloat(firstResult.x) });
        setCurrentLocationName(firstResult.place_name);
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
        setCurrentSelectedLocation(null);
        setCurrentLocationName('');
        if (markerInstanceRef.current) markerInstanceRef.current.setMap(null);
      } else {
        alert('위치 검색 중 오류가 발생했습니다.');
      }
    });
  }, [isMapSdkLoaded]);

  const handleSearchResultClick = useCallback((result) => {
    if (!mapInstanceRef.current) return;

    const locPosition = new window.kakao.maps.LatLng(result.y, result.x);
    mapInstanceRef.current.setCenter(locPosition);

    if (markerInstanceRef.current) {
      markerInstanceRef.current.setPosition(locPosition);
      markerInstanceRef.current.setMap(mapInstanceRef.current);
    } else {
      markerInstanceRef.current = new window.kakao.maps.Marker({
        map: mapInstanceRef.current,
        position: locPosition,
      });
    }

    setCurrentSelectedLocation({ lat: parseFloat(result.y), lng: parseFloat(result.x) });
    setCurrentLocationName(result.place_name);
  }, []);

  const clearLocation = useCallback(() => {
    setCurrentSelectedLocation(null);
    setCurrentLocationName('');
    setSearchResults([]);

    if (markerInstanceRef.current) markerInstanceRef.current.setMap(null);
    if (mapInstanceRef.current && window.kakao?.maps) {
      mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(37.566826, 126.9786567));
    }
  }, []);

  return {
    mapRef,
    searchLocation,
    selectedLocation: currentSelectedLocation,
    locationName: currentLocationName,
    searchResults,
    setSelectedLocation: setCurrentSelectedLocation,
    setLocationName: setCurrentLocationName,
    clearLocation,
    handleSearchResultClick,
  };
}
