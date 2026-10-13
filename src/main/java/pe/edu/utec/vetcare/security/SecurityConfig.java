package pe.edu.utec.vetcare.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    @Bean
    public InMemoryUserDetailsManager userDetailsService(
            PasswordEncoder passwordEncoder
    ) {

        UserDetails admin =
                User.withUsername("admin")
                        .password(
                                passwordEncoder.encode("admin123")
                        )
                        .roles("ADMIN")
                        .build();

        UserDetails veterinario =
                User.withUsername("veterinario")
                        .password(
                                passwordEncoder.encode("vet123")
                        )
                        .roles("VETERINARIO")
                        .build();

        UserDetails propietario =
                User.withUsername("propietario")
                        .password(
                                passwordEncoder.encode("prop123")
                        )
                        .roles("PROPIETARIO")
                        .build();

        return new InMemoryUserDetailsManager(
                admin,
                veterinario,
                propietario
        );
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .csrf(csrf ->
                        csrf.disable()
                )

                .authorizeHttpRequests(auth -> auth

                        // USUARIOS
                        .requestMatchers(
                                "/api/usuarios/**"
                        )
                        .hasRole("ADMIN")

                        // PROPIETARIOS
                        .requestMatchers(
                                "/api/propietarios/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "PROPIETARIO"
                        )

                        // VETERINARIOS
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/veterinarios/**"
                        )
                        .authenticated()

                        .requestMatchers(
                                "/api/veterinarios/**"
                        )
                        .hasRole("ADMIN")

                        // MASCOTAS
                        .requestMatchers(
                                "/api/mascotas/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "VETERINARIO",
                                "PROPIETARIO"
                        )

                        // HISTORIAS CLINICAS
                        .requestMatchers(
                                "/api/historias-clinicas/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "VETERINARIO",
                                "PROPIETARIO"
                        )

                        // CITAS
                        .requestMatchers(
                                "/api/citas/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "VETERINARIO",
                                "PROPIETARIO"
                        )

                        // ATENCIONES
                        .requestMatchers(
                                "/api/atenciones/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "VETERINARIO"
                        )

                        .anyRequest()
                        .authenticated()
                )

                .httpBasic(
                        Customizer.withDefaults()
                );

        return http.build();
    }
}