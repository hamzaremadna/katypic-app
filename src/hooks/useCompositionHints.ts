import { useState, useEffect } from "react";
import { DeviceMotion } from "expo-sensors";

export interface CompositionHint {
  type: "horizon_tilt" | "hold_steady";
  severity: "info" | "warning";
  message: string;
  value: number;
}

export function useCompositionHints() {
  const [horizonAngle, setHorizonAngle] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [hints, setHints] = useState<CompositionHint[]>([]);

  useEffect(() => {
    DeviceMotion.setUpdateInterval(100);

    const subscription = DeviceMotion.addListener((data) => {
      if (data.rotation) {
        const gamma = (data.rotation.gamma * 180) / Math.PI;
        setHorizonAngle(gamma);
      }

      if (data.acceleration) {
        const magnitude = Math.sqrt(
          (data.acceleration.x || 0) ** 2 +
          (data.acceleration.y || 0) ** 2 +
          (data.acceleration.z || 0) ** 2
        );
        setIsShaking(magnitude > 1.5);
      }
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const newHints: CompositionHint[] = [];

    if (Math.abs(horizonAngle) > 2) {
      newHints.push({
        type: "horizon_tilt",
        severity: Math.abs(horizonAngle) > 5 ? "warning" : "info",
        message: `Horizon penché (${horizonAngle.toFixed(1)}°)`,
        value: horizonAngle,
      });
    }

    if (isShaking) {
      newHints.push({
        type: "hold_steady",
        severity: "warning",
        message: "Maintenez l'appareil stable",
        value: 0,
      });
    }

    setHints(newHints);
  }, [horizonAngle, isShaking]);

  return { hints, horizonAngle, isShaking };
}
