
package pe.edu.utec.vetcare.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService customUserDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(customUserDetailsService);

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth

                        // 1. ENDPOINTS PÚBLICOS
                        .requestMatchers(
                                "/api/auth/**",
                                "/actuator/health",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // 2. PERFIL PROPIO
                        .requestMatchers(HttpMethod.PUT, "/api/usuarios/me").hasAnyAuthority(
                                "ROLE_VETERINARIO", "ROLE_PROPIETARIO")

                        // 3. ADMINISTRACIÓN DE USUARIOS
                        .requestMatchers("/api/usuarios/**").hasAuthority("ROLE_ADMIN")

                        // 4. VETERINARIOS

                        // Crear veterinarios
                        .requestMatchers(HttpMethod.POST, "/api/veterinarios")
                        .hasAuthority("ROLE_ADMIN")

                        // Modificar veterinarios
                        .requestMatchers(HttpMethod.PUT, "/api/veterinarios/**")
                        .hasAuthority("ROLE_ADMIN")

                        // Eliminar veterinarios
                        .requestMatchers(HttpMethod.DELETE, "/api/veterinarios/**")
                        .hasAuthority("ROLE_ADMIN")

                        // Consultar veterinarios
                        .requestMatchers(HttpMethod.GET, "/api/veterinarios", "/api/veterinarios/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_VETERINARIO")

                        // 5. CITAS

                        // Consultar citas
                        .requestMatchers(HttpMethod.GET, "/api/citas", "/api/citas/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_VETERINARIO", "ROLE_PROPIETARIO")

                        // Crear citas
                        .requestMatchers(HttpMethod.POST, "/api/citas")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_PROPIETARIO")

                        // Confirmar citas
                        .requestMatchers(HttpMethod.PUT, "/api/citas/*/confirmar")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_VETERINARIO")

                        // Cancelar citas
                        .requestMatchers(HttpMethod.PUT, "/api/citas/*/cancelar")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_VETERINARIO", "ROLE_PROPIETARIO")

                        // Marcar citas como atendidas
                        .requestMatchers(HttpMethod.PUT, "/api/citas/*/atender")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_VETERINARIO")

                        // Modificar citas
                        .requestMatchers(HttpMethod.PUT, "/api/citas/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_PROPIETARIO")

                        // Eliminar físicamente citas
                        .requestMatchers(HttpMethod.DELETE, "/api/citas/**")
                        .hasAuthority("ROLE_ADMIN")

                        // 6. ATENCIONES

                        // Consultar atenciones
                        .requestMatchers(HttpMethod.GET, "/api/atenciones", "/api/atenciones/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_VETERINARIO", "ROLE_PROPIETARIO")

                        // Registrar atenciones
                        .requestMatchers(HttpMethod.POST, "/api/atenciones")
                        .hasAuthority("ROLE_VETERINARIO")

                        // Modificar atenciones
                        .requestMatchers(HttpMethod.PUT, "/api/atenciones/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_VETERINARIO")

                        // Eliminar atenciones
                        .requestMatchers(HttpMethod.DELETE, "/api/atenciones/**")
                        .hasAuthority("ROLE_ADMIN")

                        // 7. HISTORIAS CLÍNICAS

                        // Consultar historia clínica
                        .requestMatchers(HttpMethod.GET, "/api/historias-clinicas", "/api/historias-clinicas/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_VETERINARIO", "ROLE_PROPIETARIO")

                        // No permitir crear, modificar o eliminar
                        // historias clínicas directamente
                        .requestMatchers("/api/historias-clinicas/**")
                        .denyAll()

                        // 8. CUALQUIER OTRA RUTA
                        .anyRequest()
                        .authenticated()
                )

                // No utilizar sesiones de servidor
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Proveedor de autenticación
                .authenticationProvider(authenticationProvider())

                // Verificar JWT antes del filtro habitual
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
