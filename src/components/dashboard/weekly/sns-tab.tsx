'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SNSTabProps {
  workspaceId: string
}

export function SNSTab({ workspaceId }: SNSTabProps) {
  // Mock data
  const channels = [
    {
      name: 'Instagram',
      uploads: 5,
      views: 45000,
      reach: 32000,
      engagement: 2800,
      followers: 12500,
      change: { views: 12.5, reach: 8.3, engagement: 15.2, followers: 2.1 },
    },
    {
      name: 'Facebook',
      uploads: 3,
      views: 12000,
      reach: 8500,
      engagement: 650,
      followers: 4200,
      change: { views: -5.2, reach: -3.1, engagement: 2.5, followers: 0.8 },
    },
    {
      name: 'YouTube',
      uploads: 2,
      views: 8500,
      reach: null,
      engagement: 420,
      followers: 2100,
      change: { views: 25.3, reach: null, engagement: 18.7, followers: 3.5 },
    },
  ]

  const topPosts = [
    {
      channel: 'Instagram',
      type: 'Reel',
      title: '신제품 언박싱 리뷰',
      url: 'https://instagram.com/p/xxx',
      views: 15000,
      engagement: 1200,
    },
    {
      channel: 'YouTube',
      type: 'Video',
      title: '2024 트렌드 분석',
      url: 'https://youtube.com/watch?v=xxx',
      views: 5500,
      engagement: 280,
    },
    {
      channel: 'Instagram',
      type: 'Post',
      title: '주간 베스트 상품 소개',
      url: 'https://instagram.com/p/yyy',
      views: 8200,
      engagement: 650,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Channel Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>채널별 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-4 text-left font-medium">채널</th>
                  <th className="py-2 px-4 text-right font-medium">업로드</th>
                  <th className="py-2 px-4 text-right font-medium">조회수</th>
                  <th className="py-2 px-4 text-right font-medium">도달</th>
                  <th className="py-2 px-4 text-right font-medium">상호작용</th>
                  <th className="py-2 px-4 text-right font-medium">팔로워</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => (
                  <tr key={channel.name} className="border-b">
                    <td className="py-3 px-4 font-medium">{channel.name}</td>
                    <td className="py-3 px-4 text-right">{channel.uploads}</td>
                    <td className="py-3 px-4 text-right">
                      <div>{channel.views.toLocaleString()}</div>
                      <div className={`text-xs ${channel.change.views >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {channel.change.views >= 0 ? '+' : ''}{channel.change.views}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {channel.reach ? (
                        <>
                          <div>{channel.reach.toLocaleString()}</div>
                          <div className={`text-xs ${channel.change.reach && channel.change.reach >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {channel.change.reach ? `${channel.change.reach >= 0 ? '+' : ''}${channel.change.reach}%` : ''}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div>{channel.engagement.toLocaleString()}</div>
                      <div className={`text-xs ${channel.change.engagement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {channel.change.engagement >= 0 ? '+' : ''}{channel.change.engagement}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div>{channel.followers.toLocaleString()}</div>
                      <div className={`text-xs ${channel.change.followers >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {channel.change.followers >= 0 ? '+' : ''}{channel.change.followers}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top 게시물</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPosts.map((post, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-sm w-6">{index + 1}</span>
                  <div>
                    <div className="font-medium">{post.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {post.channel} · {post.type}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{post.views.toLocaleString()} 조회</div>
                  <div className="text-sm text-muted-foreground">{post.engagement.toLocaleString()} 상호작용</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
