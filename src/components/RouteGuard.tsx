"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import routes from "@/app/configs/route.config";
import { Flex, Spin } from "antd";
import NotFound from '@/app/not-found';

interface RouteGuardProps {
	children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const pathname = usePathname();
  const [isRouteEnabled, setIsRouteEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const performChecks = async () => {
      setLoading(true);
      setIsRouteEnabled(false);

      const checkRouteEnabled = () => {
        if (!pathname) return false;

        if (pathname in routes) {
          return routes[pathname as keyof typeof routes];
        }

        return false;
      };

      const routeEnabled = checkRouteEnabled();
      setIsRouteEnabled(routeEnabled);

      setLoading(false);
    };

    performChecks();
  }, [pathname]);

  if (loading) {
    return (
      <Flex>
        <Spin />
      </Flex>
    );
  }

  if (!isRouteEnabled) {
		return <NotFound />;
	}

  return <>{children}</>;
};

export { RouteGuard };
