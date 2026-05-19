import SwiftUI

/// 神秘风格背景 — 星河粒子动效
struct MysticBackgroundView: View {
    @State private var particles: [Particle] = []
    @State private var size: CGSize = .zero
    let particleCount = 30
    let timer = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()

    var body: some View {
        GeometryReader { geo in
            ZStack {
                Theme.background

                ForEach(particles) { particle in
                    Circle()
                        .fill(Theme.gold.opacity(particle.opacity))
                        .frame(width: particle.size, height: particle.size)
                        .position(particle.position)
                        .blur(radius: particle.blur)
                }

                Circle()
                    .fill(Theme.primaryLight.opacity(0.05))
                    .frame(width: geo.size.width * 0.8)
                    .blur(radius: 100)
                    .position(x: geo.size.width * 0.2, y: geo.size.height * 0.3)

                Circle()
                    .fill(Theme.mysticBlue.opacity(0.03))
                    .frame(width: geo.size.width * 0.6)
                    .blur(radius: 80)
                    .position(x: geo.size.width * 0.8, y: geo.size.height * 0.7)
            }
            .onAppear {
                size = geo.size
                initParticles(in: geo.size)
            }
            .onReceive(timer) { _ in
                updateParticles()
            }
        }
        .ignoresSafeArea()
    }

    private func initParticles(in size: CGSize) {
        particles = (0..<particleCount).map { _ in
            Particle(
                id: UUID(),
                position: CGPoint(
                    x: CGFloat.random(in: 0...size.width),
                    y: CGFloat.random(in: 0...size.height)
                ),
                size: CGFloat.random(in: 1...3),
                opacity: Double.random(in: 0.1...0.6),
                blur: CGFloat.random(in: 0...1),
                speed: CGFloat.random(in: 0.2...0.8),
                direction: Angle.degrees(Double.random(in: 0...360))
            )
        }
    }

    private func updateParticles() {
        for i in particles.indices {
            let radians = particles[i].direction.radians
            particles[i].position.x += cos(radians) * particles[i].speed
            particles[i].position.y += sin(radians) * particles[i].speed

            if particles[i].position.x > size.width + 10 { particles[i].position.x = -10 }
            if particles[i].position.x < -10 { particles[i].position.x = size.width + 10 }
            if particles[i].position.y > size.height + 10 { particles[i].position.y = -10 }
            if particles[i].position.y < -10 { particles[i].position.y = size.height + 10 }
        }
    }

    struct Particle: Identifiable {
        let id: UUID
        var position: CGPoint
        let size: CGFloat
        let opacity: Double
        let blur: CGFloat
        let speed: CGFloat
        let direction: Angle
    }

    static func useAsBackground() -> some View {
        MysticBackgroundView()
    }
}
