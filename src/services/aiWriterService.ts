import { message } from 'antd';

// AI写作请求接口
export interface AIWritingRequest {
  title: string;
  tags: string[];
  requirements: string;
  language?: string;
}

// AI写作响应接口
export interface AIWritingResponse {
  content: string;
  success: boolean;
  error?: string;
}

/**
 * AI写作服务
 * 使用OpenAI API根据标题、标签和用户要求生成文章内容
 */
class AIWriterService {
  private apiKey: string | null = null;
  private baseURL: string = 'https://api.openai.com/v1';

  constructor() {
    // 从环境变量获取API密钥（Vite使用import.meta.env）
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
    console.log('OpenAI API Key:', this.apiKey);
  }

  /**
   * 检查API密钥是否配置
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * 生成文章内容
   */
  async generateContent(request: AIWritingRequest): Promise<AIWritingResponse> {
    if (!this.isConfigured()) {
      return {
        content: '',
        success: false,
        error: 'OpenAI API密钥未配置，请在.env文件中设置VITE_OPENAI_API_KEY'
      };
    }

    try {
      const prompt = this.buildPrompt(request);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: '你是一位专业的文章写作助手，请根据用户提供的信息生成一篇结构完整、内容丰富的文章。文章应该包含引言、正文和结论部分，使用适当的段落划分。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('AI生成的内容为空');
      }

      return {
        content: this.formatContent(content),
        success: true
      };

    } catch (error) {
      console.error('AI写作服务错误:', error);
      return {
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'AI写作服务发生未知错误'
      };
    }
  }

  /**
   * 构建AI提示词
   */
  private buildPrompt(request: AIWritingRequest): string {
    const { title, tags, requirements, language = '中文' } = request;
    
    const tagsText = tags.length > 0 ? `标签：${tags.join(', ')}` : '无特定标签';
    
    return `请根据以下信息生成一篇${language}文章：

文章标题：${title}
${tagsText}
用户要求：${requirements}

请生成一篇结构完整、内容丰富的文章，包含：
1. 引人入胜的开头
2. 逻辑清晰的正文内容
3. 有力的总结或结论
4. 适当的段落划分

文章内容请直接输出，不要添加任何说明性文字。`;
  }

  /**
   * 格式化生成的内容
   */
  private formatContent(content: string): string {
    // 清理可能的多余空格和换行
    return content
      .replace(/\n{3,}/g, '\n\n') // 将多个连续换行替换为两个换行
      .trim();
  }

  /**
   * 模拟生成内容（用于测试或演示）
   */
  async generateMockContent(request: AIWritingRequest): Promise<AIWritingResponse> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { title, tags, requirements } = request;
    const tagsText = tags.length > 0 ? `标签：${tags.join(', ')}` : '无特定标签';
    
    const mockContent = `# ${title}

## 文章概述

这是一篇基于您提供的信息生成的示例文章。

**标题**：${title}
**${tagsText}**
**用户要求**：${requirements}

## 正文内容

文章正文将根据您的具体需求进行创作。这里展示的是模拟内容，实际使用时会调用AI服务生成真实的内容。

### 主要观点

- 根据标题和标签确定文章主题
- 结合用户要求进行内容创作
- 确保文章结构完整、逻辑清晰

### 详细阐述

文章将包含详细的论述和例证，确保内容充实且有价值。

## 总结

通过AI写作功能，您可以快速获得高质量的文章草稿，然后根据需要进行修改和完善。

---
*本文由AI写作助手生成*`;

    return {
      content: mockContent,
      success: true
    };
  }
}

// 导出单例实例
export const aiWriterService = new AIWriterService();