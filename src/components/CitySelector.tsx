'use client';

import { useState, useRef, useEffect } from 'react';
import { provinces } from '@/lib/cities';

interface CitySelectorProps {
  value: string;
  onChange: (city: string) => void;
}

export default function CitySelector({ value, onChange }: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const containerRef = useRef<HTMLDivElement>(null);

  // 解析当前值找出对应的省份和城市
  useEffect(() => {
    if (!value) {
      setSelectedProvince('');
      return;
    }

    for (const province of provinces) {
      if (province.name === value) {
        setSelectedProvince(province.name);
        break;
      }
      if (province.cities.some(city => city.name === value)) {
        setSelectedProvince(province.name);
        break;
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProvinceClick = (provinceName: string) => {
    setSelectedProvince(provinceName);
    // 如果直辖市/自治区只有一层，直接选中
    const province = provinces.find(p => p.name === provinceName);
    if (province && province.cities.length === 0) {
      onChange(provinceName);
      setIsOpen(false);
    }
  };

  const handleCityClick = (cityName: string) => {
    onChange(cityName);
    setIsOpen(false);
  };

  return (
    <div className="location-info" ref={containerRef}>
      <span>📍</span>
      <span onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        {value || '选择城市'}
      </span>
      <span style={{ fontSize: '12px' }}>▼</span>

      {isOpen && (
        <div className="dropdown" style={{ display: 'flex' }}>
          {/* 省份选择 */}
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {provinces.map((province) => (
              <div
                key={province.name}
                className={`dropdown-item ${selectedProvince === province.name ? 'selected' : ''}`}
                onClick={() => handleProvinceClick(province.name)}
              >
                {province.name}
              </div>
            ))}
          </div>

          {/* 城市选择 */}
          {selectedProvince && (
            <div style={{ maxHeight: '400px', overflowY: 'auto', minWidth: '150px' }}>
              {provinces
                .find(p => p.name === selectedProvince)
                ?.cities.map((city) => (
                  <div
                    key={city.name}
                    className={`dropdown-item ${value === city.name ? 'selected' : ''}`}
                    onClick={() => handleCityClick(city.name)}
                  >
                    {city.name}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
