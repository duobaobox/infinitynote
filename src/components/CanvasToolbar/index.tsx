import React, { useState, useEffect } from "react";
import { Button, Space, Typography, Tooltip, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { aiService } from "../../services/aiService";
import { providerRegistry } from "../../services/ai/ProviderRegistry";
import type { ProviderId } from "../../services/ai/ProviderRegistry";
import { iconRegistry } from "../../utils/iconRegistry";
import type { IconType } from "../../utils/iconRegistry";
import styles from "./index.module.css";

const { Text } = Typography;

// 创建动态图标组件
const DynamicIcon = ({ type }: { type: IconType }) => {
  const IconComponent = iconRegistry[type];
  // @ts-expect-error - iconRegistry包含多种类型，需要忽略类型检查
  return IconComponent ? <IconComponent /> : null;
};

export const CanvasToolbar: React.FC = () => {
  const [currentProvider, setCurrentProvider] = useState<string>("");
  const [currentModel, setCurrentModel] = useState<string>("");
  const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
  const [isChangingModel, setIsChangingModel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 加载当前活跃配置和已配置的提供商
  useEffect(() => {
    const loadActiveConfig = async () => {
      try {
        setIsLoading(true);

        // 使用 getSettings() 确保从数据库加载最新配置
        const settings = await aiService.getSettings();
        const config = settings.activeConfig || aiService.getActiveConfig();
        console.log("📌 CanvasToolbar - 系统当前配置:", {
          provider: config.provider,
          model: config.model,
          appliedAt: config.appliedAt,
        });

        // 获取所有已配置的提供商（有API密钥的）
        const allProviders = providerRegistry.getAllProviderIds();
        const configured: string[] = [];

        for (const providerId of allProviders) {
          const hasKey = await aiService.hasAPIKey(providerId);
          if (hasKey) {
            configured.push(providerId);
            console.log(`✓ 已配置提供商: ${providerId}`);
          }
        }

        setConfiguredProviders(configured);

        // 直接使用系统配置，不做任何修改
        if (config.provider && config.model) {
          console.log(`� 设置显示: ${config.provider} - ${config.model}`);
          setCurrentProvider(config.provider);
          setCurrentModel(config.model);
        } else if (configured.length > 0) {
          // 只有在完全没有配置时才设置默认值
          console.warn("⚠️ 系统配置为空，使用第一个可用提供商");
          const defaultProvider = configured[0];
          const models = providerRegistry.getSupportedModels(
            defaultProvider as ProviderId
          );
          await aiService.applyConfiguration(defaultProvider, models[0]);
          setCurrentProvider(defaultProvider);
          setCurrentModel(models[0]);
        }
      } catch (error) {
        console.error("❌ 加载活跃配置失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveConfig();

    // 监听设置变化事件，当用户在设置页面修改配置时同步更新
    const handleSettingsChanged = () => {
      console.log("🔄 检测到设置变化，重新加载配置");
      loadActiveConfig();
    };

    window.addEventListener("settingsChanged", handleSettingsChanged);

    return () => {
      window.removeEventListener("settingsChanged", handleSettingsChanged);
    };
  }, []);

  // 处理模型切换
  const handleModelChange = async (providerId: string, modelName: string) => {
    // 如果点击的是当前已选中的模型，直接返回
    if (providerId === currentProvider && modelName === currentModel) {
      console.log("⚠️ 已经是当前使用的模型，无需切换");
      return;
    }

    try {
      setIsChangingModel(true);

      // 调用 AI 服务应用新配置
      await aiService.applyConfiguration(providerId, modelName);

      // 立即更新本地状态，确保UI同步
      setCurrentProvider(providerId);
      setCurrentModel(modelName);

      console.log(`✅ 已切换模型: ${providerId} - ${modelName}`);

      // 触发全局设置变化事件，通知其他组件
      window.dispatchEvent(new Event("settingsChanged"));
    } catch (error) {
      console.error("❌ 切换模型失败:", error);

      // 失败时重新加载配置，确保显示正确的状态
      const config = aiService.getActiveConfig();
      setCurrentProvider(config.provider);
      setCurrentModel(config.model);
    } finally {
      setIsChangingModel(false);
    }
  };

  // 生成分组菜单项
  const getMenuItems = (): MenuProps["items"] => {
    if (configuredProviders.length === 0) {
      return [
        {
          key: "no-config",
          label: "未配置任何提供商",
          disabled: true,
        },
      ];
    }

    const items: MenuProps["items"] = [];

    configuredProviders.forEach((providerId) => {
      try {
        const metadata = providerRegistry.getProviderMetadata(
          providerId as ProviderId
        );
        const models = providerRegistry.getSupportedModels(
          providerId as ProviderId
        );
        const color = providerRegistry.getProviderColor(
          providerId as ProviderId,
          "light"
        );

        // 为每个提供商创建一个分组
        items.push({
          key: providerId,
          type: "group",
          label: (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: color,
                }}
              />
              <span>{metadata.name}</span>
            </div>
          ),
          children: models.map((model) => {
            const isActive =
              providerId === currentProvider && model === currentModel;
            return {
              key: `${providerId}:${model}`,
              label: (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>{model}</span>
                  {isActive && (
                    <span style={{ color: color, marginLeft: 8 }}>✓</span>
                  )}
                </div>
              ),
              onClick: () => handleModelChange(providerId, model),
            };
          }),
        });
      } catch (error) {
        console.error(`获取提供商 ${providerId} 信息失败:`, error);
      }
    });

    return items;
  };

  // 打开设置页面
  const handleOpenSettings = () => {
    // 触发打开设置页面的事件
    window.dispatchEvent(
      new CustomEvent("openSettings", { detail: { tab: "model" } })
    );
  };

  // 获取提供商颜色
  const getProviderColor = (): string => {
    if (!currentProvider || currentProvider.trim() === "") {
      return "#1890ff";
    }
    try {
      return providerRegistry.getProviderColor(
        currentProvider as ProviderId,
        "light"
      );
    } catch {
      return "#1890ff";
    }
  };

  // 获取提供商名称
  const getProviderName = (): string => {
    if (!currentProvider || currentProvider.trim() === "") {
      return "未配置";
    }
    try {
      const metadata = providerRegistry.getProviderMetadata(
        currentProvider as ProviderId
      );
      return metadata?.name || currentProvider;
    } catch {
      return currentProvider;
    }
  };

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className={styles.canvasToolbar}>
        <Space size={8} align="center">
          <Text type="secondary" style={{ fontSize: 11 }}>
            加载中...
          </Text>
        </Space>
      </div>
    );
  }

  // 如果没有配置任何提供商
  if (configuredProviders.length === 0) {
    return (
      <div className={styles.canvasToolbar}>
        <Space size={8} align="center" style={{ width: "100%" }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            未配置AI提供商
          </Text>
          <Tooltip title="前往设置" placement="top">
            <Button
              type="link"
              size="small"
              onClick={handleOpenSettings}
              style={{ fontSize: 11, padding: 0, height: "auto" }}
            >
              去配置
            </Button>
          </Tooltip>
        </Space>
      </div>
    );
  }

  return (
    <div className={styles.canvasToolbar}>
      <Space size={8} align="center" style={{ width: "100%" }}>
        {/* 提供商标签 - 更紧凑 */}
        <div className={styles.providerBadge}>
          <div
            className={styles.providerDot}
            style={{ backgroundColor: getProviderColor() }}
          />
          <Text className={styles.providerText}>{getProviderName()}</Text>
        </div>

        {/* 模型文字选择器 */}
        <Dropdown
          menu={{ items: getMenuItems() }}
          trigger={["click"]}
          disabled={isChangingModel}
        >
          <Button
            type="text"
            size="small"
            loading={isChangingModel}
            className={styles.modelButton}
            style={{ flex: 1, textAlign: "left" }}
          >
            <Space size={4}>
              <Text className={styles.modelText}>{currentModel}</Text>
              <DynamicIcon type="DownOutlined" />
            </Space>
          </Button>
        </Dropdown>
      </Space>
    </div>
  );
};
